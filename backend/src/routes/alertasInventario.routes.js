const express = require("express");
const controller = require("../controllers/alertasInventario.controller");

const router = express.Router();

router.get("/", controller.listarAlertas);
router.get("/resumen", controller.obtenerResumen);
router.patch("/:id/tratar", controller.tratarAlerta);
router.post("/tratar-masivo", controller.tratarMasivo);
router.get("/configuracion", controller.obtenerConfiguracion);
router.put("/configuracion", controller.guardarConfiguracion);
router.post("/enviar-notificacion", controller.enviarNotificacion);
router.get("/historial-notificaciones", controller.historialNotificaciones);
router.post("/ejecutar-ahora", controller.ejecutarAhora);

module.exports = router;