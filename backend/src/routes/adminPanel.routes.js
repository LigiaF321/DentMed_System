const express = require("express");
const router = express.Router();

const adminPanel = require("../controllers/adminPanel.controller");
const horarios = require("../controllers/horarios.controller");
const configuracionRoutes = require("./configuracion.routes");

router.get("/panel-principal", adminPanel.getPanelPrincipal);
router.use("/configuracion", configuracionRoutes);

module.exports = router;