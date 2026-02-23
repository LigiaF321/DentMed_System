const express = require("express");
const router = express.Router();

const horariosCtrl = require("../controllers/horarios.controller");

router.get("/", horariosCtrl.getHorarios);
router.put("/semanal", horariosCtrl.upsertHorarioSemanal);
router.post("/excepcion", horariosCtrl.createExcepcion);
router.delete("/excepcion/:id", horariosCtrl.deleteExcepcion);

module.exports = router;