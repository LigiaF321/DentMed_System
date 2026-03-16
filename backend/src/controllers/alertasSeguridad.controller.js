const { AlertaSeguridad, Usuario } = require("../models");
const { Op } = require("sequelize");
const alertasSeguridadService = require("../services/alertasSeguridad.service");

// GET /api/admin/seguridad/alertas - Listar alertas con filtros
async function getAlertasSeguridad(req, res) {
  try {
    const {
      estado = 'activa',
      prioridad,
      fecha_desde,
      fecha_hasta,
      tipo_alerta,
      pagina = 1,
      limite = 10
    } = req.query;

    const where = {};
    if (estado !== 'todas') where.estado = estado;
    if (prioridad && prioridad !== 'todas') where.prioridad = prioridad;
    if (tipo_alerta) where.tipo_alerta = tipo_alerta;
    if (fecha_desde || fecha_hasta) {
      where.fecha_alerta = {};
      if (fecha_desde) where.fecha_alerta[Op.gte] = new Date(fecha_desde);
      if (fecha_hasta) where.fecha_alerta[Op.lte] = new Date(fecha_hasta);
    }

    const offset = (pagina - 1) * limite;

    const alertas = await AlertaSeguridad.findAndCountAll({
      where,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'silenciador', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'revisor', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha_alerta', 'DESC']],
      limit: parseInt(limite),
      offset: parseInt(offset)
    });

    return res.json({
      alertas: alertas.rows,
      total: alertas.count,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(alertas.count / limite)
    });
  } catch (err) {
    console.error("Error obteniendo alertas de seguridad:", err);
    return res.status(500).json({ message: "No se pudieron cargar las alertas de seguridad" });
  }
}

// GET /api/admin/seguridad/alertas/resumen - Resumen para dashboard
async function getResumenAlertas(req, res) {
  try {
    const resumen = await AlertaSeguridad.findAll({
      where: { estado: 'activa' },
      attributes: [
        'prioridad',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['prioridad']
    });

    const ultimasAlertas = await AlertaSeguridad.findAll({
      where: { estado: 'activa' },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
      order: [['fecha_alerta', 'DESC']],
      limit: 5
    });

    const counts = { critica: 0, advertencia: 0, informativa: 0 };
    resumen.forEach(item => {
      counts[item.prioridad] = parseInt(item.dataValues.count);
    });

    return res.json({
      total_criticas: counts.critica,
      total_advertencias: counts.advertencia,
      total_informativas: counts.informativa,
      ultimas_alertas: ultimasAlertas
    });
  } catch (err) {
    console.error("Error obteniendo resumen de alertas:", err);
    return res.status(500).json({ message: "No se pudo obtener el resumen" });
  }
}

// PATCH /api/admin/seguridad/alertas/:id/silenciar - Silenciar alerta
async function silenciarAlerta(req, res) {
  try {
    const { id } = req.params;
    const { justificacion, duracion } = req.body;
    const usuarioId = req.user.id; // Asumiendo middleware de auth

    if (!justificacion || justificacion.trim() === '') {
      return res.status(400).json({ message: "La justificación es obligatoria" });
    }

    let silenciadaHasta = null;
    if (duracion === '1hora') silenciadaHasta = new Date(Date.now() + 60 * 60 * 1000);
    else if (duracion === '24horas') silenciadaHasta = new Date(Date.now() + 24 * 60 * 60 * 1000);
    else if (duracion === '7dias') silenciadaHasta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    // Si duracion es null o 'permanente', queda null

    await AlertaSeguridad.update({
      estado: 'silenciada',
      silenciada_hasta: silenciadaHasta,
      silenciada_por: usuarioId,
      justificacion_silencio: justificacion
    }, { where: { id } });

    return res.json({ message: "Alerta silenciada exitosamente" });
  } catch (err) {
    console.error("Error silenciando alerta:", err);
    return res.status(500).json({ message: "No se pudo silenciar la alerta" });
  }
}

// PATCH /api/admin/seguridad/alertas/:id/revisar - Marcar como revisada
async function revisarAlerta(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    await AlertaSeguridad.update({
      estado: 'revisada',
      revisada_por: usuarioId,
      fecha_revision: new Date()
    }, { where: { id } });

    return res.json({ message: "Alerta marcada como revisada" });
  } catch (err) {
    console.error("Error revisando alerta:", err);
    return res.status(500).json({ message: "No se pudo marcar la alerta como revisada" });
  }
}

// GET /api/admin/seguridad/configuracion - Obtener configuración
async function obtenerConfiguracion(req, res) {
  try {
    // Por ahora devolver configuración por defecto
    const config = {
      intentos_fallidos_umbral: 5,
      ventana_minutos: 10,
      bloqueo_intentos: 3,
      horario_inicio: 8,
      horario_fin: 20,
      dias_laborables: [1, 2, 3, 4, 5]
    };
    return res.json(config);
  } catch (err) {
    console.error("Error obteniendo configuración:", err);
    return res.status(500).json({ message: "No se pudo obtener la configuración" });
  }
}

// PUT /api/admin/seguridad/configuracion - Guardar configuración
async function guardarConfiguracion(req, res) {
  try {
    const config = req.body;
    // Aquí guardar en BD cuando esté implementado
    return res.json({ message: "Configuración guardada" });
  } catch (err) {
    console.error("Error guardando configuración:", err);
    return res.status(500).json({ message: "No se pudo guardar la configuración" });
  }
}

// POST /api/admin/seguridad/ip/bloquear - Bloquear IP
async function bloquearIP(req, res) {
  try {
    const { ip, motivo } = req.body;
    // Implementar bloqueo de IP
    return res.json({ message: `IP ${ip} bloqueada` });
  } catch (err) {
    console.error("Error bloqueando IP:", err);
    return res.status(500).json({ message: "No se pudo bloquear la IP" });
  }
}

// GET /api/admin/seguridad/reporte-semanal - Reporte semanal
async function obtenerReporteSemanal(req, res) {
  try {
    const reporte = await alertasSeguridadService.generarReporteSemanal();
    return res.json(reporte);
  } catch (err) {
    console.error("Error generando reporte semanal:", err);
    return res.status(500).json({ message: "No se pudo generar el reporte" });
  }
}

// GET /api/admin/seguridad/exportar - Exportar alertas
async function exportarAlertas(req, res) {
  try {
    const { formato = 'json', estado, prioridad, fecha_desde, fecha_hasta } = req.query;

    // Construir filtros
    const where = {};
    if (estado && estado !== 'todas') where.estado = estado;
    if (prioridad && prioridad !== 'todas') where.prioridad = prioridad;
    if (fecha_desde || fecha_hasta) {
      where.fecha_alerta = {};
      if (fecha_desde) where.fecha_alerta[Op.gte] = new Date(fecha_desde);
      if (fecha_hasta) where.fecha_alerta[Op.lte] = new Date(fecha_hasta);
    }

    const alertas = await AlertaSeguridad.findAll({
      where,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'silenciador', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'revisor', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha_alerta', 'DESC']]
    });

    if (formato === 'json') {
      return res.json({ alertas });
    } else if (formato === 'pdf') {
      // Preparado para PDF - requeriría pdfkit
      return res.json({ message: 'Exportación PDF preparada', alertas: alertas.length });
    } else if (formato === 'excel') {
      // Preparado para Excel - requeriría exceljs
      return res.json({ message: 'Exportación Excel preparada', alertas: alertas.length });
    }

    return res.status(400).json({ message: 'Formato no soportado' });
  } catch (err) {
    console.error("Error exportando alertas:", err);
    return res.status(500).json({ message: "No se pudieron exportar las alertas" });
  }
}

module.exports = {
  getAlertasSeguridad,
  getResumenAlertas,
  silenciarAlerta,
  revisarAlerta,
  obtenerConfiguracion,
  guardarConfiguracion,
  bloquearIP,
  obtenerReporteSemanal,
  exportarAlertas
};