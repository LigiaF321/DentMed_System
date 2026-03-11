const kardexService = require("../services/kardex.service");

function getUsuarioId(req) {
  return req.user?.id || req.usuario?.id || 1;
}

function getIp(req) {
  return req.ip || req.headers["x-forwarded-for"] || null;
}

async function buscarInsumos(req, res, next) {
  try {
    const data = await kardexService.buscarInsumos(req.query.q || "");
    res.json(data);
  } catch (error) {
    console.error("KARDEX buscarInsumos:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

async function listarMovimientos(req, res, next) {
  try {
    const data = await kardexService.listarMovimientos(req.query);
    res.json(data);
  } catch (error) {
    console.error("KARDEX listarMovimientos:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

async function obtenerMovimiento(req, res, next) {
  try {
    const data = await kardexService.obtenerMovimiento(req.params.id);
    res.json(data);
  } catch (error) {
    console.error("KARDEX obtenerMovimiento:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

async function obtenerResumenInsumo(req, res, next) {
  try {
    const data = await kardexService.obtenerResumenInsumo(req.params.insumo_id);
    res.json(data);
  } catch (error) {
    console.error("KARDEX obtenerResumenInsumo:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

async function obtenerStockActual(req, res, next) {
  try {
    const data = await kardexService.obtenerStockActual(req.params.insumo_id);
    res.json(data);
  } catch (error) {
    console.error("KARDEX obtenerStockActual:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

async function validarSalida(req, res, next) {
  try {
    const data = await kardexService.validarSalida(
      req.query.insumo_id,
      req.query.cantidad
    );
    res.json(data);
  } catch (error) {
    console.error("KARDEX validarSalida:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

async function registrarEntrada(req, res, next) {
  try {
    const data = await kardexService.registrarEntrada(req.body, {
      usuarioId: getUsuarioId(req),
      ip: getIp(req),
    });

    res.status(201).json({
      message: "Entrada registrada correctamente",
      data,
    });
  } catch (error) {
    console.error("KARDEX registrarEntrada:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

async function registrarSalida(req, res, next) {
  try {
    const data = await kardexService.registrarSalida(req.body, {
      usuarioId: getUsuarioId(req),
      ip: getIp(req),
    });

    res.status(201).json({
      message: "Salida registrada correctamente",
      data,
    });
  } catch (error) {
    console.error("KARDEX registrarSalida:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

async function registrarAjuste(req, res, next) {
  try {
    const data = await kardexService.registrarAjuste(req.body, {
      usuarioId: getUsuarioId(req),
      ip: getIp(req),
    });

    res.status(201).json({
      message: "Ajuste registrado correctamente",
      data,
    });
  } catch (error) {
    console.error("KARDEX registrarAjuste:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

async function eliminarMovimiento(req, res, next) {
  try {
    const data = await kardexService.eliminarMovimiento(
      req.params.id,
      req.body?.justificacion,
      {
        usuarioId: getUsuarioId(req),
        ip: getIp(req),
      }
    );

    res.json({
      message: "Movimiento eliminado correctamente",
      data,
    });
  } catch (error) {
    console.error("KARDEX eliminarMovimiento:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

async function exportarMovimientos(req, res, next) {
  try {
    const csv = await kardexService.exportarMovimientosCSV(req.query);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="kardex_movimientos.csv"'
    );

    res.send(csv);
  } catch (error) {
    console.error("KARDEX exportarMovimientos:", error.parent?.sqlMessage || error.message);
    if (error.sql) console.error("SQL:", error.sql);
    next(error);
  }
}

module.exports = {
  buscarInsumos,
  listarMovimientos,
  obtenerMovimiento,
  obtenerResumenInsumo,
  obtenerStockActual,
  validarSalida,
  registrarEntrada,
  registrarSalida,
  registrarAjuste,
  eliminarMovimiento,
  exportarMovimientos,
};