const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const tratamientosController = require("../controllers/tratamientos.controller");

// B1: Listar tratamientos de un paciente con filtros y paginación
router.get("/pacientes/:id/tratamientos", verifyToken, tratamientosController.listarTratamientosPaciente);

// B2: Obtener detalle completo de un tratamiento
router.get("/tratamientos/:id", verifyToken, tratamientosController.obtenerDetalleTratamiento);

// B3: Generar PDF con historial completo del paciente
router.get("/tratamientos/exportar-pdf/:id_paciente", verifyToken, tratamientosController.exportarHistorialPDF);

// B4: Obtener sesiones de un tratamiento multi-sesión
router.get("/tratamientos/:id/sesiones", verifyToken, tratamientosController.obtenerSesionesTratamiento);

module.exports = router;
