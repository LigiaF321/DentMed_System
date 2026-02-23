const { Op, fn, col } = require("sequelize");
const { Cita, Consultorio, Material, Dentista } = require("../models");

function lastNDaysLabels(n = 14) {
  const days = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);

  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    const dd = String(x.getDate()).padStart(2, "0");
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    days.push({
      key: x.toISOString().slice(0, 10),
      label: `${dd}/${mm}`,
    });
  }
  return days;
}

async function getPanelPrincipal(req, res) {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // 1) CITAS POR ESTADO (HOY) 
    const citasPorEstado = await Cita.findAll({
      attributes: ["estado", [fn("COUNT", col("id")), "count"]],
      where: { fecha_hora: { [Op.between]: [start, end] } },
      group: ["estado"],
      raw: true,
    });

    const resumen = {
      citas_totales: 0,
      citas_pendientes: 0,
      citas_atendidas: 0,  
      citas_canceladas: 0, 
      consultorios_ocupados: 0,
      consultorios_totales: 0,
      pacientes_hoy: 0,
      profesionales_activos: 0,
    };

    for (const row of citasPorEstado) {
      const estado = String(row.estado || "").toLowerCase();
      const count = Number(row.count || 0);
      resumen.citas_totales += count;

      if (estado === "programada" || estado === "confirmada") resumen.citas_pendientes += count;
      else if (estado === "completada") resumen.citas_atendidas += count;
      else if (estado === "cancelada") resumen.citas_canceladas += count;
    }

    // 2) CONSULTORIOS
    resumen.consultorios_totales = await Consultorio.count();
    resumen.consultorios_ocupados = await Consultorio.count({
      where: { estado: "Ocupado" },
    });

    // 3) PACIENTES HOY 
    resumen.pacientes_hoy = await Cita.count({
      where: { fecha_hora: { [Op.between]: [start, end] } },
      distinct: true,
      col: "id_paciente",
    });

    // 4) PROFESIONALES (dentistas)
    resumen.profesionales_activos = await Dentista.count();

    // 5) MOVIMIENTO 14 DÍAS (por fecha_hora)
    const days = lastNDaysLabels(14);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 13);

    const mov = await Cita.findAll({
      attributes: [
        [fn("DATE", col("fecha_hora")), "dia"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: { fecha_hora: { [Op.gte]: since } },
      group: [fn("DATE", col("fecha_hora"))],
      order: [[fn("DATE", col("fecha_hora")), "ASC"]],
      raw: true,
    });

    const mapMov = new Map(mov.map((r) => [String(r.dia), Number(r.count || 0)]));
    const etiquetas = days.map((d) => d.label);
    const datos = days.map((d) => mapMov.get(d.key) || 0);

    // 6) STOCK CRÍTICO 
    const productosCriticos = await Material.findAll({
      attributes: ["nombre", "cantidad_actual", "stock_minimo"],
      where: {
        [Op.and]: [
          
          Material.sequelize.where(col("cantidad_actual"), Op.lte, col("stock_minimo")),
        ],
      },
      order: [["cantidad_actual", "ASC"]],
      limit: 10,
      raw: true,
    });

    const productos = productosCriticos.map((p) => ({
      nombre: p.nombre,
      stock_actual: Number(p.cantidad_actual),
      stock_minimo: Number(p.stock_minimo),
      nivel: "critico",
    }));

    const stock_critico = {
      total_criticos: productos.length,
      productos,
    };

    // 7) NOTIFICACIONES IMPORTANTES 
    const notificaciones = [];

    if (stock_critico.total_criticos > 0) {
      notificaciones.push({
        tipo: "urgente",
        mensaje: `${stock_critico.total_criticos} producto(s) con stock crítico`,
        accion: "/inventario",
      });
    }

    // citas mañana pendientes 
    const mananaStart = new Date(start);
    mananaStart.setDate(mananaStart.getDate() + 1);
    const mananaEnd = new Date(end);
    mananaEnd.setDate(mananaEnd.getDate() + 1);

    const citasManana = await Cita.count({
      where: {
        fecha_hora: { [Op.between]: [mananaStart, mananaEnd] },
        estado: { [Op.in]: ["Programada", "Confirmada"] },
      },
    });

    if (citasManana > 0) {
      notificaciones.push({
        tipo: "pendiente",
        mensaje: `${citasManana} cita(s) por confirmar para mañana`,
        accion: "/citas",
      });
    }

    if (notificaciones.length === 0) {
      notificaciones.push({
        tipo: "informacion",
        mensaje: "Sin alertas críticas por el momento",
        accion: null,
      });
    }

    return res.json({
      fecha: new Date().toISOString().slice(0, 10),
      resumen_dia: resumen,
      movimiento_citas: { periodo: "14_dias", etiquetas, datos },
      stock_critico,
      notificaciones,
      ultima_actualizacion: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Panel principal error:", err);
    return res.status(500).json({
      message: "Error generando panel principal",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

module.exports = { getPanelPrincipal };