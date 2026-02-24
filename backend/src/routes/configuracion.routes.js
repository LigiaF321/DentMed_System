const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/configuracion.controller");

router.get("/", ctrl.getConfiguracion);
router.put("/", ctrl.putConfiguracion);
router.post("/reset", ctrl.resetConfiguracion);
router.get("/historial", ctrl.getHistorial);

module.exports = router;