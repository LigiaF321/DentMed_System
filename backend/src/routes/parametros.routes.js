const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/parametros.controller");

router.get("/", ctrl.getParametros);
router.put("/", ctrl.updateParametros);
router.post("/reset", ctrl.resetParametros);

router.get("/historial", ctrl.getHistorial);
router.get("/historial/export", ctrl.exportHistorial);

module.exports = router;