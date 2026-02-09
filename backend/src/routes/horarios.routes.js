const express = require("express");
const router = express.Router();

const {
  getHorarios,
  setHorarios,
} = require("../controllers/horarios.controller");

// GET /api/horarios
router.get("/", getHorarios);

// POST /api/horarios
router.post("/", setHorarios);

module.exports = router;
