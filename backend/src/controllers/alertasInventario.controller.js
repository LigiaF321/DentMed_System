const alertasService = require("../services/alertasInventario.service");
const { enviarReporteAlertas } = require("../services/alertasNotificacion.service");
const { registrarAuditoria } = require("../services/auditoria.service");
const { reprogramarCronSemanalAlertas } = require("../services/alertasCron.service");

function getUsuarioId(req) {
  return req.user?.id || req.usuario?.id || null;
}

function getIp(req) {
  return req.ip || req.headers["x-forwarded-for"] || null;
}

async function listarAlertas(req, res, next) {
  try {
    const data = await alertasService.listarAlertas(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function obtenerResumen(req, res, next) {
  try {
    const data = await alertasService.obtenerResumen();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function tratarAlerta(req, res, next) {
  try {
    const data = await alertasService.marcarTratada(
      req.params.id,
      getUsuarioId(req),
      req.body?.notas
    );

    await registrarAuditoria({
      id_usuario: getUsuarioId(req),
      accion: "TRATAR_ALERTA_INDIVIDUAL",
      modulo: "alertas_inventario",
      detalles: {
        alerta_id: req.params.id,
        notas: req.body?.notas || "",
      },
      ip: getIp(req),
    });

    res.json({
      message: "Alerta marcada como tratada",
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function tratarMasivo(req, res, next) {
  try {
    const data = await alertasService.tratarMasivo(
      req.body?.ids,
      getUsuarioId(req),
      req.body?.notas
    );

    await registrarAuditoria({
      id_usuario: getUsuarioId(req),
      accion: "TRATAR_ALERTAS_MASIVO",
      modulo: "alertas_inventario",
      detalles: {
        ids: req.body?.ids || [],
        notas: req.body?.notas || "",
      },
      ip: getIp(req),
    });

    res.json({
      message: "Alertas marcadas como tratadas",
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerConfiguracion(req, res, next) {
  try {
    const data = await alertasService.obtenerConfiguracionActual();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function guardarConfiguracion(req, res, next) {
  try {
    const data = await alertasService.actualizarConfiguracion(req.body);

    await registrarAuditoria({
      id_usuario: getUsuarioId(req),
      accion: "ACTUALIZAR_CONFIGURACION_ALERTAS",
      modulo: "alertas_inventario",
      detalles: req.body,
      ip: getIp(req),
    });

    await reprogramarCronSemanalAlertas();

    res.json({
      message: "Configuración actualizada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function historialNotificaciones(req, res, next) {
  try {
    const data = await alertasService.obtenerHistorialNotificaciones(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function ejecutarAhora(req, res, next) {
  try {
    const data = await alertasService.ejecutarCalculoAlertas();

    await registrarAuditoria({
      id_usuario: getUsuarioId(req),
      accion: "EJECUCION_MANUAL_CALCULO_ALERTAS",
      modulo: "alertas_inventario",
      detalles: data,
      ip: getIp(req),
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function enviarNotificacion(req, res, next) {
  try {
    const data = await enviarReporteAlertas({
      manual: true,
      id_usuario: getUsuarioId(req),
      ip: getIp(req),
    });

    res.json({
      message: "Reporte enviado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarAlertas,
  obtenerResumen,
  tratarAlerta,
  tratarMasivo,
  obtenerConfiguracion,
  guardarConfiguracion,
  historialNotificaciones,
  ejecutarAhora,
  enviarNotificacion,
};