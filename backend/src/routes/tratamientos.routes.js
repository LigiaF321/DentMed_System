const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const tratamientosController = require("../controllers/tratamientos.controller");


router.get("/tratamientos", verifyToken, tratamientosController.listarTodos);
router.post("/tratamientos", verifyToken, tratamientosController.guardarTratamiento);
router.get("/pacientes/:id/tratamientos", verifyToken, tratamientosController.listarTratamientosPaciente);
router.get("/tratamientos/:id", verifyToken, tratamientosController.obtenerDetalleTratamiento);
router.get("/tratamientos/exportar-pdf/:id_paciente", verifyToken, tratamientosController.exportarHistorialPDF);
router.get("/tratamientos/:id/sesiones", verifyToken, tratamientosController.obtenerSesionesTratamiento);
router.put("/tratamientos/:id", verifyToken, tratamientosController.actualizarTratamiento);

module.exports = router;