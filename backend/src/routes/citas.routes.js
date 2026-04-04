const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const {
  verificarDisponibilidad,
  crearCita,
  cancelarCita,
} = require("../controllers/citas.controller");

const {
  crearPreReserva,
  actualizarConsultorioCita,
  eliminarPreReserva,
} = require("../controllers/consultorios.controller");

router.get("/verificar-disponibilidad", verifyToken, verificarDisponibilidad);
router.post("/", verifyToken, crearCita);
router.patch("/:id/cancelar", verifyToken, cancelarCita);

router.post("/pre-reserva", verifyToken, crearPreReserva);
router.put("/:id/consultorio", verifyToken, actualizarConsultorioCita);
router.delete("/pre-reserva/:id", verifyToken, eliminarPreReserva);

module.exports = router;