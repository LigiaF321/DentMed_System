const { Auditoria } = require("../models");

async function registrarAuditoria({
  id_usuario = null,
  accion,
  modulo = "alertas_inventario",
  detalles = "",
  ip = null,
}) {
  try {
    await Auditoria.create({
      id_usuario,
      accion,
      modulo,
      detalles:
        typeof detalles === "string" ? detalles : JSON.stringify(detalles),
      ip,
    });
  } catch (error) {
    console.error("❌ Error registrando auditoría:", error.message);
  }
}

module.exports = {
  registrarAuditoria,
};