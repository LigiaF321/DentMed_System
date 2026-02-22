const jwt = require("jsonwebtoken");

// Middleware para validar el token (Requisito para Tarea 6.1)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Formato "Bearer TOKEN"

    if (!token) {
        return res.status(403).json({ message: "Acceso denegado. No se proporcionó un token." });
    }

    try {
        // CORRECCIÓN: Usamos la misma clave que en el Controller
        const decoded = jwt.verify(token, "DENTMED_SECRET_KEY_2026"); 
        req.user = decoded; 
        next();
    } catch (error) {
        // Si sale este error es porque la clave de arriba no coincide con la del controller
        return res.status(401).json({ message: "Token inválido o expirado." });
    }
};

module.exports = { verifyToken };