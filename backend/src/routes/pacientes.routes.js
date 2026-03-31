const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const {
  buscarPacientes,
  crearPacienteRapido,
} = require("../controllers/pacientes.controller");

router.get("/buscar", verifyToken, buscarPacientes);
router.post("/", verifyToken, crearPacienteRapido);

module.exports = router;