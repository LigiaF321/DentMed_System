/**
 * Middleware de auditoría
 * Registra todas las acciones realizadas en el sistema
 */

const { Auditoria } = require("../models");
const { getClientIp } = require("../utils/audit.utils");

/**
 * Middleware para extraer y almacenar datos útiles en request
 */
function auditMiddleware(req, res, next) {
  // Guardar IP en el request
  req.clientIp = getClientIp(req);
  req.auditData = {
    ip: req.clientIp,
    usuario_id: req.user?.id || null,
    usuario_nombre: req.user?.nombre_completo || null,
  };

  next();
}

/**
 * Función helper para registrar una acción en auditoría
 * Se puede usar en controladores
 */
async function logAudit(req, accion, modulo = null, detalles = null) {
  try {
    await Auditoria.create({
      id_usuario: req.user?.id || req.auditData?.usuario_id,
      accion,
      modulo: modulo || extractModulo(req),
      detalles: detalles ? JSON.stringify(detalles) : null,
      ip: req.clientIp || req.auditData?.ip,
    });
  } catch (err) {
    console.error("Error registrando auditoría:", err.message);
    // No lanzar error, solo registrar en logs
  }
}

/**
 * Extrae el módulo de la URL de la petición
 */
function extractModulo(req) {
  const path = req.path || "";
  const partes = path.split("/").filter(Boolean);
  if (partes.length >= 2) {
    return partes[1]; // api/admin/MODULO
  }
  return "general";
}

module.exports = {
  auditMiddleware,
  logAudit,
};
