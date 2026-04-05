const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const soloAdmin = require("../middlewares/soloAdmin");

const {
  listarConsultoriosAdmin,
  crearConsultorioAdmin,
  actualizarConsultorioAdmin,
  eliminarConsultorioAdmin,
  cambiarMantenimientoConsultorioAdmin,
  cambiarEstadoConsultorioAdmin,
  obtenerHistorialConsultorioAdmin,
} = require("../controllers/adminConsultorios.controller");

router.get("/", verifyToken, soloAdmin, listarConsultoriosAdmin);
router.post("/", verifyToken, soloAdmin, crearConsultorioAdmin);
router.put("/:id", verifyToken, soloAdmin, actualizarConsultorioAdmin);
router.delete("/:id", verifyToken, soloAdmin, eliminarConsultorioAdmin);

router.put(
  "/:id/mantenimiento",
  verifyToken,
  soloAdmin,
  cambiarMantenimientoConsultorioAdmin
);

router.put("/:id/estado", verifyToken, soloAdmin, cambiarEstadoConsultorioAdmin);

router.get(
  "/:id/historial",
  verifyToken,
  soloAdmin,
  obtenerHistorialConsultorioAdmin
);

module.exports = router;