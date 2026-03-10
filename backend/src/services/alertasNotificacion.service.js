const {
  Usuario,
  Material,
  AlertaInventario,
  ConfiguracionAlerta,
  HistorialNotificacion,
} = require("../models");
const { Op } = require("sequelize");
const { sendInventoryAlertsReportEmail } = require("./email.service");
const { registrarAuditoria } = require("./auditoria.service");

function normalizarListaCorreos(texto = "") {
  if (!texto) return [];

  return [...new Set(
    texto
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )];
}

async function obtenerDestinatariosConfigurados() {
  const config = await ConfiguracionAlerta.findByPk(1);

  const admins = await Usuario.findAll({
    where: {
      rol: "admin",
      activo: true,
    },
    attributes: ["email"],
  });

  const correosAdmins = admins
    .map((u) => (u.email || "").trim().toLowerCase())
    .filter(Boolean);

  const adicionales = normalizarListaCorreos(
    config?.destinatarios_adicionales || ""
  );

  return [...new Set([...correosAdmins, ...adicionales])];
}

async function obtenerAlertasActualesParaReporte() {
  const alertas = await AlertaInventario.findAll({
    where: {
      activa: true,
      nivel: {
        [Op.in]: ["critico", "preventivo"],
      },
    },
    include: [
      {
        model: Material,
        as: "insumo",
        attributes: ["id", "nombre", "unidad_medida"],
      },
    ],
    order: [
      ["nivel", "ASC"],
      ["fecha_alerta", "DESC"],
    ],
  });

  const criticas = alertas.filter((a) => a.nivel === "critico");
  const preventivas = alertas.filter((a) => a.nivel === "preventivo");

  return { criticas, preventivas };
}

async function registrarHistorial({
  destinatarios = [],
  total_alertas = 0,
  criticas = 0,
  preventivas = 0,
  resultado = "exitoso",
}) {
  return HistorialNotificacion.create({
    fecha_envio: new Date(),
    destinatarios: destinatarios.join(", "),
    total_alertas,
    criticas,
    preventivas,
    resultado,
  });
}

async function enviarReporteAlertas({ manual = false, id_usuario = null, ip = null } = {}) {
  const destinatarios = await obtenerDestinatariosConfigurados();

  if (!destinatarios.length) {
    await registrarHistorial({
      destinatarios: [],
      total_alertas: 0,
      criticas: 0,
      preventivas: 0,
      resultado: "fallido",
    });

    throw new Error("No hay destinatarios configurados para el reporte");
  }

  const { criticas, preventivas } = await obtenerAlertasActualesParaReporte();

  try {
    const result = await sendInventoryAlertsReportEmail({
      to: destinatarios.join(", "),
      criticas,
      preventivas,
      appUrl: `${process.env.APP_URL || "http://localhost:5173"}/admin/alertas`,
    });

    await registrarHistorial({
      destinatarios,
      total_alertas: criticas.length + preventivas.length,
      criticas: criticas.length,
      preventivas: preventivas.length,
      resultado: "exitoso",
    });

    await registrarAuditoria({
      id_usuario,
      accion: manual
        ? "ENVIO_MANUAL_REPORTE_ALERTAS"
        : "ENVIO_AUTOMATICO_REPORTE_ALERTAS",
      modulo: "alertas_inventario",
      detalles: {
        destinatarios,
        criticas: criticas.length,
        preventivas: preventivas.length,
        total: criticas.length + preventivas.length,
        simulated: !!result.simulated,
      },
      ip,
    });

    return {
      ok: true,
      simulated: !!result.simulated,
      destinatarios,
      total_alertas: criticas.length + preventivas.length,
      criticas: criticas.length,
      preventivas: preventivas.length,
    };
  } catch (error) {
    await registrarHistorial({
      destinatarios,
      total_alertas: criticas.length + preventivas.length,
      criticas: criticas.length,
      preventivas: preventivas.length,
      resultado: "fallido",
    });

    await registrarAuditoria({
      id_usuario,
      accion: manual
        ? "FALLO_ENVIO_MANUAL_REPORTE_ALERTAS"
        : "FALLO_ENVIO_AUTOMATICO_REPORTE_ALERTAS",
      modulo: "alertas_inventario",
      detalles: {
        error: error.message,
        destinatarios,
      },
      ip,
    });

    throw error;
  }
}

module.exports = {
  obtenerDestinatariosConfigurados,
  obtenerAlertasActualesParaReporte,
  enviarReporteAlertas,
};