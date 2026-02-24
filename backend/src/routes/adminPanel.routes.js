const express = require("express");
const router = express.Router();

const adminPanel = require("../controllers/adminPanel.controller");
const horarios = require("../controllers/horarios.controller");

router.get("/panel-principal", adminPanel.getPanelPrincipal);

module.exports = router;