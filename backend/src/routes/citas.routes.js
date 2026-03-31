const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const {
  verificarDisponibilidad,
  crearCita,
} = require("../controllers/citas.controller");

router.get("/verificar-disponibilidad", verifyToken, verificarDisponibilidad);
router.post("/", verifyToken, crearCita);

module.exports = router;