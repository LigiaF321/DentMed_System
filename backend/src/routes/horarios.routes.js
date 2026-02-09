const express = require("express");
const router = express.Router();

const {
  getHorarios,
} = require("../controllers/horarios.controller");

// GET /api/horarios
router.get("/", getHorarios);

module.exports = router;
