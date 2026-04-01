const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware"); //
const { 
  listarConsultorios, 
  sugerirConsultorios, 
  crearPreReserva, 
  actualizarConsultorioCita, 
  eliminarPreReserva 
} = require("../controllers/consultorios.controller"); //

router.get("/", verifyToken, listarConsultorios);
router.get("/sugerir", verifyToken, sugerirConsultorios);
router.post("/pre-reserva", verifyToken, crearPreReserva);
router.put("/citas/:id/consultorio", verifyToken, actualizarConsultorioCita);
router.delete("/pre-reserva/:id", verifyToken, eliminarPreReserva);

module.exports = router;