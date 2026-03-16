const express = require("express");
const controller = require("../controllers/alertasSeguridad.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const soloAdmin = require("../middlewares/soloAdmin");

const router = express.Router();

// Todas las rutas requieren autenticación y rol administrador
router.use(verifyToken);
router.use(soloAdmin);

router.get("/alertas", controller.getAlertasSeguridad);
router.get("/alertas/resumen", controller.getResumenAlertas);
router.patch("/alertas/:id/silenciar", controller.silenciarAlerta);
router.patch("/alertas/:id/revisar", controller.revisarAlerta);
router.get("/configuracion", controller.obtenerConfiguracion);
router.put("/configuracion", controller.guardarConfiguracion);
router.post("/ip/bloquear", controller.bloquearIP);
router.get("/reporte-semanal", controller.obtenerReporteSemanal);
router.get("/exportar", controller.exportarAlertas);

module.exports = router;