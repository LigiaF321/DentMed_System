const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
// Si ya tienes middleware soloAdmin, puedes usarlo en PUT
// const soloAdmin = require("../middlewares/soloAdmin");

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
// mejor así si quieres restringir admin:
// router.put("/:id/equipos", verifyToken, soloAdmin, actualizarEquiposConsultorio);

router.post("/pre-reserva", verifyToken, crearPreReserva);
router.put("/citas/:id/consultorio", verifyToken, actualizarConsultorioCita);
router.delete("/pre-reserva/:id", verifyToken, eliminarPreReserva);

module.exports = router;