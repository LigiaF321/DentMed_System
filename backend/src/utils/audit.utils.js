/**
 * Utilidades para auditoría
 */

/**
 * Obtiene la IP del cliente desde la petición
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0])?.split(",")[0]?.trim() || null;
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || null;
}

module.exports = { getClientIp };
