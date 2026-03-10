// Utilidad para registrar acciones de auditoría
const Auditoria = require('../models/Auditoria');

/**
 * Registra una acción en la tabla de auditoría
 * @param {Object} params - Parámetros de auditoría
 * @param {number|null} params.usuario_id - ID del usuario (puede ser null)
 * @param {string} params.usuario_nombre - Nombre del usuario
 * @param {string} params.usuario_rol - Rol ('admin', 'dentista', 'sistema')
 * @param {string} params.accion - Acción realizada
 * @param {string} params.modulo - Módulo del sistema
 * @param {string} params.resultado - Resultado ('exito', 'fallido', 'bloqueado', 'advertencia')
 * @param {string} params.ip - IP del cliente
 * @param {string} [params.user_agent] - User agent
 * @param {string} params.detalle - Descripción legible
 * @param {Object} [params.metadatos] - Metadatos JSON
 * @param {string} [params.session_id] - ID de sesión
 */
async function logAuditAction({
  usuario_id = null,
  usuario_nombre = '',
  usuario_rol = '',
  accion = '',
  modulo = '',
  resultado = '',
  ip = '',
  user_agent = '',
  detalle = '',
  metadatos = {},
  session_id = ''
}) {
  try {
    await Auditoria.create({
      fecha_hora: new Date(),
      usuario_id,
      usuario_nombre,
      usuario_rol,
      accion,
      modulo,
      resultado,
      ip,
      user_agent,
      detalle,
      metadatos,
      session_id,
      created_at: new Date()
    });
  } catch (err) {
    console.error('Error registrando auditoría:', err);
  }
}

module.exports = logAuditAction;
