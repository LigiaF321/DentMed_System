const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    const secret = process.env.JWT_SECRET || "secreto_desarrollo";
    const decoded = jwt.verify(token, secret);

    // ==========================================
    // ADMIN MAESTRO TEMPORAL
    // ==========================================
    if (decoded?.master === true && decoded?.rol === "admin") {
      const adminMaster = {
        id: decoded.id || 0,
        username: decoded.username || "Admin",
        rol: "admin",
        master: true,
      };

      req.user = adminMaster;
      req.usuario = adminMaster;
      req.auth = adminMaster;

      return next();
    }

    // ==========================================
    // USUARIOS NORMALES
    // ==========================================
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no autorizado" });
    }

    const userPayload = {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      rol: usuario.rol,
    };

    req.user = userPayload;
    req.usuario = userPayload;
    req.auth = userPayload;

    next();
  } catch (error) {
    console.error("Error en verifyToken:", error);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

module.exports = {
  verifyToken,
};