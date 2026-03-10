const { Op, literal } = require("sequelize");
const {
  Material,
  AlertaInventario,
  ConfiguracionAlerta,
  HistorialNotificacion,
} = require("../models");

async function obtenerConfiguracion() {
  const [config] = await ConfiguracionAlerta.findOrCreate({
    where: { id: 1 },
    defaults: {
      notificaciones_activas: true,
      dia_envio: 1,
      hora_envio: "08:00:00",
      destinatarios_adicionales: "",
      umbral_preventivo: 20,
    },
  });

  return config;
}

function calcularNivel(stockActual, stockMinimo, umbralPreventivo = 20) {
  const actual = Number(stockActual || 0);
  const minimo = Number(stockMinimo || 0);
  const umbral = Number(umbralPreventivo || 0);

  if (actual < minimo) return "critico";

  const limitePreventivo = minimo * (1 + umbral / 100);
  if (actual <= limitePreventivo) return "preventivo";

  return "normal";
}

async function ejecutarCalculoAlertas() {
  const config = await obtenerConfiguracion();
  const materiales = await Material.findAll();

  let procesadas = 0;
  let criticas = 0;
  let preventivas = 0;
  let normales = 0;

  for (const material of materiales) {
    const stockActual = material.cantidad_actual;
    const stockMinimo = material.stock_minimo;
    const nivel = calcularNivel(stockActual, stockMinimo, config.umbral_preventivo);

    const alertaActiva = await AlertaInventario.findOne({
      where: {
        id_insumo: material.id,
        activa: true,
      },
      order: [["fecha_alerta", "DESC"]],
    });

    if (nivel === "normal") {
      normales++;

      if (alertaActiva) {
        await alertaActiva.update({
          activa: false,
          fecha_tratada: new Date(),
          notas: "Resuelta automáticamente por normalización del stock",
        });
      }

      procesadas++;
      continue;
    }

    if (nivel === "critico") criticas++;
    if (nivel === "preventivo") preventivas++;

    if (!alertaActiva) {
      await AlertaInventario.create({
        id_insumo: material.id,
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        nivel,
        fecha_alerta: new Date(),
        activa: true,
      });
    } else if (
      alertaActiva.nivel !== nivel ||
      alertaActiva.stock_actual !== stockActual ||
      alertaActiva.stock_minimo !== stockMinimo
    ) {
      await alertaActiva.update({
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        nivel,
        fecha_alerta: new Date(),
      });
    }

    procesadas++;
  }

  return {
    ok: true,
    procesadas,
    criticas,
    preventivas,
    normales,
  };
}

async function listarAlertas(query = {}) {
  const {
    nivel,
    estado = "activas",
    desde,
    hasta,
    pagina = 1,
    limite = 10,
  } = query;

  const where = {};

  if (nivel && nivel !== "todos") {
    where.nivel = nivel;
  }

  if (estado === "activas") {
    where.activa = true;
  } else if (estado === "tratadas") {
    where.activa = false;
  }

  if (desde || hasta) {
    where.fecha_alerta = {};
    if (desde) where.fecha_alerta[Op.gte] = new Date(desde);
    if (hasta) where.fecha_alerta[Op.lte] = new Date(hasta);
  }

  const page = Number(pagina);
  const pageSize = Number(limite);
  const offset = (page - 1) * pageSize;

  const { rows, count } = await AlertaInventario.findAndCountAll({
    where,
    include: [
      {
        model: Material,
        as: "insumo",
        attributes: ["id", "nombre", "cantidad_actual", "stock_minimo", "unidad_medida"],
      },
    ],
    limit: pageSize,
    offset,
    order: [
      [
        literal(`
          CASE
            WHEN nivel = 'critico' THEN 1
            WHEN nivel = 'preventivo' THEN 2
            ELSE 3
          END
        `),
        "ASC",
      ],
      ["fecha_alerta", "DESC"],
    ],
  });

  return {
    data: rows,
    pagination: {
      total: count,
      pagina: page,
      limite: pageSize,
      totalPaginas: Math.ceil(count / pageSize),
    },
  };
}

async function obtenerResumen() {
  const [total_criticas, total_preventivas, lista] = await Promise.all([
    AlertaInventario.count({
      where: { activa: true, nivel: "critico" },
    }),
    AlertaInventario.count({
      where: { activa: true, nivel: "preventivo" },
    }),
    AlertaInventario.findAll({
      where: {
        activa: true,
        nivel: { [Op.in]: ["critico", "preventivo"] },
      },
      include: [
        {
          model: Material,
          as: "insumo",
          attributes: ["id", "nombre", "cantidad_actual", "stock_minimo"],
        },
      ],
      limit: 5,
      order: [
        [
          literal(`
            CASE
              WHEN nivel = 'critico' THEN 1
              WHEN nivel = 'preventivo' THEN 2
              ELSE 3
            END
          `),
          "ASC",
        ],
        ["fecha_alerta", "DESC"],
      ],
    }),
  ]);

  return {
    total_criticas,
    total_preventivas,
    lista,
    ultima_actualizacion: new Date(),
  };
}

async function marcarTratada(id, usuarioId, notas = "") {
  const alerta = await AlertaInventario.findByPk(id);

  if (!alerta) {
    const error = new Error("Alerta no encontrada");
    error.status = 404;
    throw error;
  }

  await alerta.update({
    activa: false,
    fecha_tratada: new Date(),
    tratada_por: usuarioId || null,
    notas: notas || null,
  });

  return alerta;
}

async function tratarMasivo(ids = [], usuarioId, notas = "") {
  if (!Array.isArray(ids) || ids.length === 0) {
    const error = new Error("Debe enviar al menos un ID");
    error.status = 400;
    throw error;
  }

  await AlertaInventario.update(
    {
      activa: false,
      fecha_tratada: new Date(),
      tratada_por: usuarioId || null,
      notas: notas || null,
    },
    {
      where: {
        id: { [Op.in]: ids },
        activa: true,
      },
    }
  );

  return { ok: true, total: ids.length };
}

async function obtenerConfiguracionActual() {
  return obtenerConfiguracion();
}

async function actualizarConfiguracion(payload = {}) {
  const config = await obtenerConfiguracion();

  await config.update({
    notificaciones_activas:
      payload.notificaciones_activas ?? config.notificaciones_activas,
    dia_envio: payload.dia_envio ?? config.dia_envio,
    hora_envio: payload.hora_envio ?? config.hora_envio,
    destinatarios_adicionales:
      payload.destinatarios_adicionales ?? config.destinatarios_adicionales,
    umbral_preventivo: payload.umbral_preventivo ?? config.umbral_preventivo,
  });

  return config;
}

async function obtenerHistorialNotificaciones({ pagina = 1, limite = 10 } = {}) {
  const page = Number(pagina);
  const pageSize = Number(limite);
  const offset = (page - 1) * pageSize;

  const { rows, count } = await HistorialNotificacion.findAndCountAll({
    limit: pageSize,
    offset,
    order: [["fecha_envio", "DESC"]],
  });

  return {
    data: rows,
    pagination: {
      total: count,
      pagina: page,
      limite: pageSize,
      totalPaginas: Math.ceil(count / pageSize),
    },
  };
}

module.exports = {
  calcularNivel,
  ejecutarCalculoAlertas,
  listarAlertas,
  obtenerResumen,
  marcarTratada,
  tratarMasivo,
  obtenerConfiguracionActual,
  actualizarConfiguracion,
  obtenerHistorialNotificaciones,
};