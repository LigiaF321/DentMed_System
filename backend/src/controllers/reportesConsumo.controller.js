const reportesService = require("../services/reportesConsumo.service");

async function listarCategorias(req, res, next) {
  try {
    const data = await reportesService.listarCategorias();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function obtenerMaterialesCriticos(req, res, next) {
  try {
    const data = await reportesService.obtenerMaterialesCriticos(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function obtenerConsumoMensual(req, res, next) {
  try {
    const data = await reportesService.obtenerConsumoMensual(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function obtenerTendenciasSeisMeses(req, res, next) {
  try {
    const data = await reportesService.obtenerTendenciasSeisMeses(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function obtenerSugerenciaCompra(req, res, next) {
  try {
    const data = await reportesService.obtenerSugerenciaCompra(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function obtenerComparativaMensual(req, res, next) {
  try {
    const data = await reportesService.obtenerComparativaMensual(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function exportarReporte(req, res, next) {
  try {
    const { filename, mimeType, content } = await reportesService.exportarReporte(req.query);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarCategorias,
  obtenerMaterialesCriticos,
  obtenerConsumoMensual,
  obtenerTendenciasSeisMeses,
  obtenerSugerenciaCompra,
  obtenerComparativaMensual,
  exportarReporte,
};