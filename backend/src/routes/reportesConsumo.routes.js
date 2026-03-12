const express = require("express");
const controller = require("../controllers/reportesConsumo.controller");

const router = express.Router();

router.get("/categorias", controller.listarCategorias);
router.get("/materiales-criticos", controller.obtenerMaterialesCriticos);
router.get("/consumo-mensual", controller.obtenerConsumoMensual);
router.get("/tendencias-6-meses", controller.obtenerTendenciasSeisMeses);
router.get("/sugerencia-compra", controller.obtenerSugerenciaCompra);
router.get("/comparativa-mensual", controller.obtenerComparativaMensual);
router.get("/exportar", controller.exportarReporte);

module.exports = router;