const { Op, fn, col, literal } = require("sequelize");
const { Usuario, Auditoria } = require("../models");

function getDisplayNameFromUser(usuario) {
  if (!usuario) return "Sistema";
  if (usuario.nombre_completo) return usuario.nombre_completo;
  if (usuario.email) return usuario.email.split("@")[0];
  return `Usuario ${usuario.id}`;
}

function safeJsonParse(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function toActivityDto(item) {
  return {
    id: item.id,
    fecha_hora: item.fecha_hora,
    usuario_id: item.id_usuario,
    usuario_nombre: getDisplayNameFromUser(item.Usuario),
    usuario_rol: item.Usuario?.rol || "sistema",
    accion: item.accion,
    modulo: item.modulo,
    resultado: "OK",
    ip: item.ip,
    user_agent: null,
    detalle: item.detalles,
    metadatos: safeJsonParse(item.detalles),
    session_id: null,
  };
}

async function getActivities(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;

    const { rows, count } = await Auditoria.findAndCountAll({
      attributes: ["id", "fecha_hora", "id_usuario", "accion", "modulo", "detalles", "ip"],
      include: [
        {
          model: Usuario,
          attributes: ["id", "email", "rol"],
          required: false,
        },
      ],
      order: [["fecha_hora", "DESC"]],
      limit,
      offset,
    });

    res.json({
      data: rows.map(toActivityDto),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("getActivities error:", error);
    res.status(500).json({
      message: "Error al obtener actividades",
      error: error.message,
    });
  }
}

async function getUsuarios(req, res) {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ["id", "email", "rol", "activo"],
      order: [["email", "ASC"]],
    });

    const data = usuarios.map((u) => ({
      id: u.id,
      nombre_completo: u.email ? u.email.split("@")[0] : `Usuario ${u.id}`,
      email: u.email,
      rol: u.rol,
      activo: u.activo,
    }));

    res.json(data);
  } catch (error) {
    console.error("getUsuarios error:", error);
    res.status(500).json({
      message: "Error al obtener usuarios",
      error: error.message,
    });
  }
}

async function getSessionTimes(req, res) {
  try {
    const logs = await Auditoria.findAll({
      attributes: ["id", "fecha_hora", "id_usuario", "accion"],
      include: [
        {
          model: Usuario,
          attributes: ["id", "email"],
          required: false,
        },
      ],
      where: {
        accion: {
          [Op.in]: [
            "Inicio de sesión",
            "Cierre de sesión",
            "LOGIN",
            "LOGOUT",
            "inicio_sesion",
            "cierre_sesion",
          ],
        },
      },
      order: [
        ["id_usuario", "ASC"],
        ["fecha_hora", "ASC"],
      ],
    });

    const sesiones = [];
    const abiertas = new Map();

    for (const item of logs) {
      const userId = item.id_usuario;
      if (!userId) continue;

      const accion = String(item.accion || "").toLowerCase();
      const fecha = new Date(item.fecha_hora);

      const isLogin =
        accion.includes("inicio") || accion === "login" || accion === "inicio_sesion";
      const isLogout =
        accion.includes("cierre") || accion === "logout" || accion === "cierre_sesion";

      if (isLogin) {
        abiertas.set(userId, {
          usuario_id: userId,
          usuario_nombre: getDisplayNameFromUser(item.Usuario),
          inicio: fecha,
        });
      }

      if (isLogout && abiertas.has(userId)) {
        const abierta = abiertas.get(userId);

        sesiones.push({
          usuario_id: userId,
          usuario_nombre: abierta.usuario_nombre,
          inicio: abierta.inicio,
          fin: fecha,
          duracion_minutos: Math.max(
            0,
            Math.round((fecha.getTime() - abierta.inicio.getTime()) / 60000)
          ),
        });

        abiertas.delete(userId);
      }
    }

    res.json(sesiones);
  } catch (error) {
    console.error("getSessionTimes error:", error);
    res.status(500).json({
      message: "Error al obtener tiempos de sesión",
      error: error.message,
    });
  }
}

async function getOverview(req, res) {
  try {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [usuariosTotales, usuariosActivos, actividadesHoy, actividadesMes] =
      await Promise.all([
        Usuario.count(),
        Usuario.count({
          where: { activo: true },
        }),
        Auditoria.count({
          where: {
            fecha_hora: {
              [Op.gte]: inicioHoy,
            },
          },
        }),
        Auditoria.count({
          where: {
            fecha_hora: {
              [Op.gte]: inicioMes,
            },
          },
        }),
      ]);

    res.json({
      usuarios_totales: usuariosTotales,
      usuarios_activos: usuariosActivos,
      actividades_hoy: actividadesHoy,
      actividades_mes: actividadesMes,
    });
  } catch (error) {
    console.error("getOverview error:", error);
    res.status(500).json({
      message: "Error al obtener resumen de monitoreo",
      error: error.message,
    });
  }
}

async function getModuleStats(req, res) {
  try {
    const rows = await Auditoria.findAll({
      attributes: [
        "modulo",
        [fn("COUNT", col("id")), "total"],
      ],
      group: ["modulo"],
      order: [[literal("total"), "DESC"]],
      raw: true,
    });

    res.json(
      rows.map((r) => ({
        modulo: r.modulo || "general",
        total: Number(r.total || 0),
      }))
    );
  } catch (error) {
    console.error("getModuleStats error:", error);
    res.status(500).json({
      message: "Error al obtener estadísticas por módulo",
      error: error.message,
    });
  }
}

async function getRecentErrors(req, res) {
  try {
    const rows = await Auditoria.findAll({
      attributes: ["id", "fecha_hora", "id_usuario", "accion", "modulo", "detalles", "ip"],
      include: [
        {
          model: Usuario,
          attributes: ["id", "email", "rol"],
          required: false,
        },
      ],
      where: {
        [Op.or]: [
          { accion: { [Op.like]: "%error%" } },
          { detalles: { [Op.like]: "%error%" } },
          { detalles: { [Op.like]: "%fail%" } },
          { detalles: { [Op.like]: "%denegado%" } },
        ],
      },
      order: [["fecha_hora", "DESC"]],
      limit: 20,
    });

    res.json(rows.map(toActivityDto));
  } catch (error) {
    console.error("getRecentErrors error:", error);
    res.status(500).json({
      message: "Error al obtener errores recientes",
      error: error.message,
    });
  }
}

module.exports = {
  getActivities,
  getUsuarios,
  getSessionTimes,
  getOverview,
  getModuleStats,
  getRecentErrors,
};