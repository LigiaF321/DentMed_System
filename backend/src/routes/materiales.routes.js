const express = require("express");
const router = express.Router();
const materialesController = require("../controllers/materiales.controller");

router.get("/", materialesController.listarMateriales);
router.post("/", materialesController.crearMaterial);
router.put("/:id", materialesController.actualizarMaterial);
router.delete("/:id", materialesController.eliminarMaterial);

module.exports = router;
