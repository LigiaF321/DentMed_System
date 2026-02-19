const express = require("express");
const router = express.Router();

const { createDentistAccount } = require("../controllers/adminDentists.controller");
const {
  listarDentistas,
  obtenerDentista,
  actualizarDentista,
  cambiarEstado,
  verificarDependencias,
  eliminarDentista,
} = require("../controllers/gestionarCuentas.controller");

// Orden: rutas más específicas primero
router.get("/dentistas", listarDentistas);
router.post("/dentistas", createDentistAccount);
router.get("/dentistas/:id/dependencias", verificarDependencias);
router.patch("/dentistas/:id/estado", cambiarEstado);
router.get("/dentistas/:id", obtenerDentista);
router.put("/dentistas/:id", actualizarDentista);
router.delete("/dentistas/:id", eliminarDentista);

module.exports = router;
