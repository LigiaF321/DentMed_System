const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");

const {
  listarConsultorios,
  sugerirConsultorios,
  obtenerDisponibilidadConsultorios,
  obtenerCalendarioConsultorios,
  crearPreReserva,
  actualizarConsultorioCita,
  eliminarPreReserva,
  listarEquipamientoConsultorios,
  actualizarEquiposConsultorio,
  filtrarConsultoriosPorEquipamiento,
} = require("../controllers/consultorios.controller");

router.get("/", verifyToken, listarConsultorios);
router.get("/sugerir", verifyToken, sugerirConsultorios);
router.get("/disponibilidad", verifyToken, obtenerDisponibilidadConsultorios);
router.get("/calendario", verifyToken, obtenerCalendarioConsultorios);

router.get("/equipamiento", verifyToken, listarEquipamientoConsultorios);
router.get("/filtrar", verifyToken, filtrarConsultoriosPorEquipamiento);
router.put("/:id/equipos", verifyToken, actualizarEquiposConsultorio);

// router.put("/:id/equipos", verifyToken, soloAdmin, actualizarEquiposConsultorio);

router.post("/pre-reserva", verifyToken, crearPreReserva);
router.put("/citas/:id/consultorio", verifyToken, actualizarConsultorioCita);
router.delete("/pre-reserva/:id", verifyToken, eliminarPreReserva);

module.exports = router;