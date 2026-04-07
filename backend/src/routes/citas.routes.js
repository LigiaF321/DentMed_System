const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const {
  verificarDisponibilidad,
  crearCita,
  cancelarCita,
  reprogramarCita,
  obtenerCitasDentista,
} = require("../controllers/citas.controller");

const {
  crearPreReserva,
  actualizarConsultorioCita,
  eliminarPreReserva,
} = require("../controllers/consultorios.controller");

router.get("/dentista", verifyToken, obtenerCitasDentista);
router.get("/verificar-disponibilidad", verifyToken, verificarDisponibilidad);
router.post("/", verifyToken, crearCita);
router.patch("/:id/cancelar", verifyToken, cancelarCita);
router.patch("/:id/reprogramar", verifyToken, reprogramarCita);

router.post("/pre-reserva", verifyToken, crearPreReserva);
router.put("/:id/consultorio", verifyToken, actualizarConsultorioCita);
router.delete("/pre-reserva/:id", verifyToken, eliminarPreReserva);

module.exports = router;