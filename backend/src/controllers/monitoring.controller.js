const { Auditoria, Usuario } = require("../models");
const { Op } = require("sequelize");

/**
 * Obtener registro de actividades con filtros
 * GET /api/admin/monitoring/activities
 */
async function getActivities(req, res) {
  try {
    const {
      usuario,
      fechaDesde,
      fechaHasta,
      accion,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (usuario && usuario !== "TODOS") {
      where.id_usuario = usuario;
    }

    if (accion && accion !== "TODOS") {
      where.accion = { [Op.like]: `%${accion}%` };
    }

    if (fechaDesde || fechaHasta) {
      where.fecha_hora = {};
      if (fechaDesde) {
        where.fecha_hora[Op.gte] = new Date(fechaDesde);
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.fecha_hora[Op.lte] = hasta;
      }
    }

    const { count, rows } = await Auditoria.findAndCountAll({
      where,
      include: [
        {
          model: Usuario,
          as: "Usuario",
          attributes: ["id", "nombre_completo", "email"],
          required: false,
        },
      ],
      order: [["fecha_hora", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    const totalPages = Math.ceil(count / limit);

    return res.json({
      data: rows,
      paginacion: {
        total: count,
        pagina: parseInt(page),
        por_pagina: parseInt(limit),
        total_paginas: totalPages,
      },
    });
  } catch (err) {
    console.error("getActivities error:", err);
    return res.status(500).json({ message: "Error obteniendo actividades" });
  }
}

/**
 * Obtener alertas de seguridad (intentos fallidos)
 * GET /api/admin/monitoring/security-alerts
 */
async function getSecurityAlerts(req, res) {
  try {
    const minutosAtras = 15;
    const fechaLimite = new Date(Date.now() - minutosAtras * 60000);

    // Buscar intentos fallidos (login fallidos)
    const intentosFallidos = await Auditoria.findAll({
      where: {
        accion: { [Op.like]: "%fallido%" },
        fecha_hora: { [Op.gte]: fechaLimite },
      },
      attributes: ["ip", "fecha_hora", "accion", "detalles"],
      order: [["fecha_hora", "DESC"]],
    });

    // Agrupar por IP
    const alertasPorIP = {};
    intentosFallidos.forEach((intento) => {
      const ip = intento.ip || "Desconocida";
      if (!alertasPorIP[ip]) {
        alertasPorIP[ip] = {
          ip,
          intentos: 0,
          ultimoIntento: intento.fecha_hora,
          detalles: [],
        };
      }
      alertasPorIP[ip].intentos += 1;
      alertasPorIP[ip].detalles.push({
        fecha: intento.fecha_hora,
        accion: intento.accion,
      });
    });

    const alertas = Object.values(alertasPorIP)
      .filter((a) => a.intentos >= 3) // Solo mostrar si hay 3+ intentos
      .sort((a, b) => b.intentos - a.intentos);

    return res.json({ alertas, minutosAtras });
  } catch (err) {
    console.error("getSecurityAlerts error:", err);
    return res.status(500).json({ message: "Error obteniendo alertas" });
  }
}

/**
 * Obtener estadísticas de actividad por hora
 * GET /api/admin/monitoring/hourly-stats
 */
async function getHourlyStats(req, res) {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    const where = {};
    if (fechaDesde || fechaHasta) {
      where.fecha_hora = {};
      if (fechaDesde) {
        where.fecha_hora[Op.gte] = new Date(fechaDesde);
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.fecha_hora[Op.lte] = hasta;
      }
    }

    // Obtener todas las actividades del período
    const actividades = await Auditoria.findAll({
      where,
      attributes: ["fecha_hora"],
      raw: true,
    });

    // Agrupar por hora
    const porHora = {};
    for (let i = 0; i < 24; i++) {
      porHora[i] = 0;
    }

    actividades.forEach((act) => {
      const hora = new Date(act.fecha_hora).getHours();
      porHora[hora] += 1;
    });

    // Encontrar hora pico
    const horas = Object.entries(porHora);
    const horaPico = horas.reduce((max, actual) => 
      actual[1] > max[1] ? actual : max
    );

    const stats = horas.map(([hora, cantidad]) => ({
      hora: `${String(hora).padStart(2, "0")}:00`,
      cantidad,
    }));

    return res.json({
      stats,
      horaPico: {
        hora: `${String(horaPico[0]).padStart(2, "0")}:00`,
        cantidad: horaPico[1],
      },
    });
  } catch (err) {
    console.error("getHourlyStats error:", err);
    return res.status(500).json({ message: "Error obteniendo estadísticas" });
  }
}

/**
 * Obtener tiempo promedio de sesión por usuario
 * GET /api/admin/monitoring/session-times
 */
async function getSessionTimes(req, res) {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    const where = {};
    if (fechaDesde || fechaHasta) {
      where.fecha_hora = {};
      if (fechaDesde) {
        where.fecha_hora[Op.gte] = new Date(fechaDesde);
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.fecha_hora[Op.lte] = hasta;
      }
    }

    // Obtener inicios y cierres de sesión
    const sesiones = await Auditoria.findAll({
      where: {
        ...where,
        accion: { [Op.in]: ["Inicio de sesión", "Cierre de sesión"] },
      },
      include: [
        {
          model: Usuario,
          as: "Usuario",
          attributes: ["id", "nombre_completo"],
          required: false,
        },
      ],
      order: [["id_usuario", "ASC"], ["fecha_hora", "ASC"]],
    });

    // Calcular tiempos de sesión
    const usuariosStats = {};
    let sesionActual = null;

    sesiones.forEach((registro) => {
      const userId = registro.id_usuario;
      const userName = registro.Usuario?.nombre_completo || "Desconocido";

      if (!usuariosStats[userId]) {
        usuariosStats[userId] = {
          usuario: userName,
          tiempoTotal: 0,
          sesiones: 0,
          ultimoAcceso: null,
        };
      }

      if (registro.accion === "Inicio de sesión") {
        sesionActual = {
          inicio: registro.fecha_hora,
          userId,
        };
      } else if (registro.accion === "Cierre de sesión" && sesionActual && sesionActual.userId === userId) {
        const duracion = (new Date(registro.fecha_hora) - new Date(sesionActual.inicio)) / 60000; // minutos
        usuariosStats[userId].tiempoTotal += duracion;
        usuariosStats[userId].sesiones += 1;
        usuariosStats[userId].ultimoAcceso = registro.fecha_hora;
        sesionActual = null;
      }
    });

    // Calcular promedios
    const resultado = Object.entries(usuariosStats)
      .map(([userId, stats]) => ({
        id: userId,
        usuario: stats.usuario,
        tiempoPromedio: Math.round(stats.tiempoTotal / (stats.sesiones || 1)),
        sesiones: stats.sesiones,
        ultimoAcceso: stats.ultimoAcceso,
      }))
      .sort((a, b) => b.tiempoPromedio - a.tiempoPromedio);

    return res.json({ datos: resultado });
  } catch (err) {
    console.error("getSessionTimes error:", err);
    return res.status(500).json({ message: "Error obteniendo tiempos de sesión" });
  }
}

/**
 * Obtener lista de usuarios para filtro
 * GET /api/admin/monitoring/usuarios
 */
async function getUsuarios(req, res) {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ["id", "nombre_completo", "email"],
      order: ["nombre_completo"],
    });

    return res.json({ usuarios });
  } catch (err) {
    console.error("getUsuarios error:", err);
    return res.status(500).json({ message: "Error obteniendo usuarios" });
  }
}

module.exports = {
  getActivities,
  getSecurityAlerts,
  getHourlyStats,
  getSessionTimes,
  getUsuarios,
};
