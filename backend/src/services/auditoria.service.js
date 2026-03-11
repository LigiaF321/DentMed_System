const { Auditoria, Usuario } = require("../models");

function pickExistingAttributes(model, payload) {
  const attrs = model.rawAttributes || {};
  const out = {};

  for (const key of Object.keys(payload)) {
    if (attrs[key] !== undefined) {
      out[key] = payload[key];
    }
  }

  return out;
}

function safeStringify(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function registrarAuditoria({
  id_usuario = null,
  accion = "SIN_ACCION",
  modulo = "general",
  detalles = null,
  ip = null,
  resultado = "OK",
  user_agent = null,
  session_id = null,
} = {}) {
  try {
    let usuarioNombre = "Sistema";
    let usuarioRol = "sistema";

    if (id_usuario) {
      const usuario = await Usuario.findByPk(id_usuario, {
        attributes: ["id", "email", "rol"],
      });

      if (usuario) {
        usuarioNombre = usuario.email
          ? usuario.email.split("@")[0]
          : `Usuario ${usuario.id}`;
        usuarioRol = usuario.rol || "usuario";
      }
    }

    const detalleTexto = safeStringify(detalles);

    const payloadBase = {
      fecha_hora: new Date(),

      // compatibilidad con distintos esquemas
      id_usuario,
      usuario_id: id_usuario,

      usuario_nombre: usuarioNombre,
      usuario_rol: usuarioRol,

      accion,
      modulo,
      resultado,

      ip,
      user_agent,
      session_id,

      // compatibilidad con distintos nombres de campo
      detalle: detalleTexto,
      detalles: detalleTexto,
      metadatos: typeof detalles === "object" ? safeStringify(detalles) : null,
    };

    const payload = pickExistingAttributes(Auditoria, payloadBase);

    return await Auditoria.create(payload);
  } catch (error) {
    console.error("❌ Error registrando auditoría:", error.message);
    return null;
  }
}

module.exports = {
  registrarAuditoria,
};