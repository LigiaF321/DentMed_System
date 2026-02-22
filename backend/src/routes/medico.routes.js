const express = require("express");
const router = express.Router();
const medicoController = require("../controllers/medico.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Ruta protegida por token: Cumple con el flujo de seguridad
router.get("/dashboard", verifyToken, medicoController.getDashboardData);

module.exports = router;