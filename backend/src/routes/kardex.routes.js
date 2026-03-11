const express = require("express");
const controller = require("../controllers/kardex.controller");

const router = express.Router();

router.get("/insumos", controller.buscarInsumos);
router.get("/movimientos", controller.listarMovimientos);
router.get("/movimientos/:id", controller.obtenerMovimiento);
router.get("/resumen/:insumo_id", controller.obtenerResumenInsumo);
router.get("/stock/:insumo_id", controller.obtenerStockActual);
router.get("/validar-salida", controller.validarSalida);

router.post("/entrada", controller.registrarEntrada);
router.post("/salida", controller.registrarSalida);
router.post("/ajuste", controller.registrarAjuste);

router.delete("/movimientos/:id", controller.eliminarMovimiento);
router.get("/exportar", controller.exportarMovimientos);

module.exports = router;