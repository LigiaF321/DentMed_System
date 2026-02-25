/**
 * Middleware de autenticación mejorado con auditoría
 * Valida tokens JWT y registra intentos de login
 */

const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");
const { logAudit } = require("./audit.middleware");

/**
 * Middleware para verificar JWT y cargar usuario
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    if (!token) {
      return res.status(401).json({ message: "Token requerido" });
    }

    const secret = process.env.JWT_SECRET || "secreto_desarrollo";
    const decoded = jwt.verify(token, secret);

    // Cargar usuario desde BD
    const user = await Usuario.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    // Almacenar usuario en request
    req.user = {
      id: user.id,
      nombre_completo: user.nombre_completo,
      email: user.email,
      rol: user.rol,
    };

    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

/**
 * Middleware para verificar que sea administrador
 */
function requireAdmin(req, res, next) {
  if (req.user?.rol !== "admin") {
    logAudit(req, "Acceso denegado - No administrador", "admin", {
      ruta: req.path,
      metodo: req.method,
    }).catch(console.error);

    return res.status(403).json({ message: "Acceso denegado" });
  }

  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
};
