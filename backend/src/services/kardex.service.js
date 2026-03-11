const { Op } = require("sequelize");
const {
  sequelize,
  Material,
  MovimientoInventario,
  MovimientoEliminado,
  Usuario,
  Dentista,
  Cita,
} = require("../models");
const { registrarAuditoria } = require("./auditoria.service");

function normalizarFechaInicio(fecha) {
  if (!fecha) return null;
  return new Date(`${fecha}T00:00:00`);
}

function normalizarFechaFin(fecha) {
  if (!fecha) return null;
  return new Date(`${fecha}T23:59:59.999`);
}

function decimalOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function escapeCsv(value) {
  if (value === undefined || value === null) return "";
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

async function recalcularAlertasSafe() {
  try {
    const alertasService = require("./alertasInventario.service");
    await alertasService.ejecutarCalculoAlertas();
  } catch (error) {
    console.warn("No se pudo recalcular alertas después del movimiento:", error.message);
  }
}

async function buscarInsumos(query = "") {
  const q = String(query || "").trim();

  const where = {};
  if (q) {
    where.nombre = { [Op.like]: `%${q}%` };
  }

  const rows = await Material.findAll({
    where,
    attributes: ["id", "nombre", "unidad_medida", "cantidad_actual", "stock_minimo"],
    order: [["nombre", "ASC"]],
    limit: 20,
  });

  return rows;
}

async function listarMovimientos(query = {}) {
  const {
    insumo_id,
    fecha_desde,
    fecha_hasta,
    tipo_movimiento = "todos",
    pagina = 1,
    limite = 10,
  } = query;

  const where = {
    eliminado: false,
  };

  if (insumo_id) {
    where.id_insumo = Number(insumo_id);
  }

  if (tipo_movimiento && tipo_movimiento !== "todos") {
    where.tipo_movimiento = tipo_movimiento;
  }

  if (fecha_desde || fecha_hasta) {
    where.fecha_movimiento = {};
    if (fecha_desde) where.fecha_movimiento[Op.gte] = normalizarFechaInicio(fecha_desde);
    if (fecha_hasta) where.fecha_movimiento[Op.lte] = normalizarFechaFin(fecha_hasta);
  }

  const page = Number(pagina) || 1;
  const pageSize = Number(limite) || 10;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await MovimientoInventario.findAndCountAll({
    where,
    include: [
      {
        model: Material,
        as: "insumo",
        attributes: ["id", "nombre", "unidad_medida", "cantidad_actual", "stock_minimo"],
      },
      {
        model: Usuario,
        as: "usuarioRegistra",
        attributes: ["id", "email"],
      },
      {
        model: Dentista,
        as: "doctorResponsable",
        attributes: ["id"],
        required: false,
      },
      {
        model: Cita,
        as: "citaRelacionada",
        attributes: ["id"],
        required: false,
      },
    ],
    order: [["fecha_movimiento", "DESC"]],
    limit: pageSize,
    offset,
    distinct: true,
  });

  return {
    data: rows,
    pagination: {
      total: count,
      pagina: page,
      limite: pageSize,
      totalPaginas: Math.ceil(count / pageSize),
    },
  };
}

async function obtenerMovimiento(id) {
  const movimiento = await MovimientoInventario.findByPk(id, {
    include: [
      {
        model: Material,
        as: "insumo",
        attributes: ["id", "nombre", "unidad_medida", "cantidad_actual", "stock_minimo"],
      },
      {
        model: Usuario,
        as: "usuarioRegistra",
        attributes: ["id", "email"],
      },
      {
        model: Dentista,
        as: "doctorResponsable",
        attributes: ["id"],
        required: false,
      },
      {
        model: Cita,
        as: "citaRelacionada",
        attributes: ["id"],
        required: false,
      },
    ],
  });

  if (!movimiento) {
    const error = new Error("Movimiento no encontrado");
    error.status = 404;
    throw error;
  }

  return movimiento;
}

async function obtenerResumenInsumo(insumoId) {
  const insumo = await Material.findByPk(insumoId, {
    attributes: ["id", "nombre", "unidad_medida", "cantidad_actual", "stock_minimo"],
  });

  if (!insumo) {
    const error = new Error("Insumo no encontrado");
    error.status = 404;
    throw error;
  }

  const [ultimaEntrada, ultimaSalida] = await Promise.all([
    MovimientoInventario.findOne({
      where: {
        id_insumo: insumo.id,
        eliminado: false,
        tipo_movimiento: "entrada",
      },
      order: [["fecha_movimiento", "DESC"]],
    }),
    MovimientoInventario.findOne({
      where: {
        id_insumo: insumo.id,
        eliminado: false,
        tipo_movimiento: "salida",
      },
      order: [["fecha_movimiento", "DESC"]],
    }),
  ]);

  return {
    insumo: {
      ...insumo.toJSON(),
      costo_promedio: 0,
    },
    stock_actual: insumo.cantidad_actual,
    stock_minimo: insumo.stock_minimo,
    ultima_entrada: ultimaEntrada,
    ultima_salida: ultimaSalida,
  };
}

async function obtenerStockActual(insumoId) {
  const insumo = await Material.findByPk(insumoId, {
    attributes: ["id", "nombre", "unidad_medida", "cantidad_actual"],
  });

  if (!insumo) {
    const error = new Error("Insumo no encontrado");
    error.status = 404;
    throw error;
  }

  return {
    insumo_id: insumo.id,
    nombre: insumo.nombre,
    unidad_medida: insumo.unidad_medida,
    stock_actual: insumo.cantidad_actual,
  };
}

async function validarSalida(insumoId, cantidad) {
  const insumo = await Material.findByPk(insumoId, {
    attributes: ["id", "cantidad_actual", "unidad_medida"],
  });

  if (!insumo) {
    const error = new Error("Insumo no encontrado");
    error.status = 404;
    throw error;
  }

  const qty = Number(cantidad || 0);

  return {
    disponible: qty > 0 && qty <= Number(insumo.cantidad_actual || 0),
    stock_actual: Number(insumo.cantidad_actual || 0),
    unidad_medida: insumo.unidad_medida,
  };
}

async function registrarEntrada(payload, contexto = {}) {
  const t = await sequelize.transaction();

  try {
    const cantidad = Number(payload.cantidad || 0);
    const costoUnitario = decimalOrNull(payload.costo_unitario);

    if (cantidad <= 0) {
      const error = new Error("La cantidad debe ser mayor a 0");
      error.status = 400;
      throw error;
    }

    const insumo = await Material.findByPk(payload.insumo_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
      attributes: ["id", "nombre", "cantidad_actual"],
    });

    if (!insumo) {
      const error = new Error("Insumo no encontrado");
      error.status = 404;
      throw error;
    }

    const stockAntes = Number(insumo.cantidad_actual || 0);
    const stockDespues = stockAntes + cantidad;

    const movimiento = await MovimientoInventario.create(
      {
        id_insumo: insumo.id,
        tipo_movimiento: "entrada",
        subtipo: payload.subtipo || "compra",
        cantidad,
        stock_antes: stockAntes,
        stock_despues: stockDespues,
        costo_unitario: costoUnitario,
        costo_total: costoUnitario !== null ? cantidad * costoUnitario : null,
        fecha_movimiento: payload.fecha || new Date(),
        proveedor: payload.proveedor || null,
        factura: payload.factura || null,
        notas: payload.notas || null,
        usuario_registra: contexto.usuarioId || 1,
      },
      { transaction: t }
    );

    await insumo.update(
      {
        cantidad_actual: stockDespues,
      },
      { transaction: t }
    );

    await t.commit();

    await registrarAuditoria({
      id_usuario: contexto.usuarioId || 1,
      accion: "KARDEX_REGISTRAR_ENTRADA",
      modulo: "kardex",
      detalles: {
        insumo_id: insumo.id,
        movimiento_id: movimiento.id,
        cantidad,
        stock_antes: stockAntes,
        stock_despues: stockDespues,
      },
      ip: contexto.ip,
    });

    await recalcularAlertasSafe();

    return movimiento;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function registrarSalida(payload, contexto = {}) {
  const t = await sequelize.transaction();

  try {
    const cantidad = Number(payload.cantidad || 0);

    if (cantidad <= 0) {
      const error = new Error("La cantidad debe ser mayor a 0");
      error.status = 400;
      throw error;
    }

    const insumo = await Material.findByPk(payload.insumo_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
      attributes: ["id", "nombre", "cantidad_actual"],
    });

    if (!insumo) {
      const error = new Error("Insumo no encontrado");
      error.status = 404;
      throw error;
    }

    const stockAntes = Number(insumo.cantidad_actual || 0);

    if (cantidad > stockAntes) {
      const error = new Error(`Stock insuficiente. Stock actual: ${stockAntes}`);
      error.status = 400;
      throw error;
    }

    const stockDespues = stockAntes - cantidad;

    const movimiento = await MovimientoInventario.create(
      {
        id_insumo: insumo.id,
        tipo_movimiento: "salida",
        subtipo: payload.tipo_salida || "tratamiento",
        cantidad,
        stock_antes: stockAntes,
        stock_despues: stockDespues,
        costo_unitario: null,
        costo_total: null,
        fecha_movimiento: payload.fecha || new Date(),
        id_cita: payload.id_cita || null,
        id_doctor: payload.id_doctor || null,
        motivo: payload.motivo || null,
        notas: payload.notas || null,
        usuario_registra: contexto.usuarioId || 1,
      },
      { transaction: t }
    );

    await insumo.update(
      {
        cantidad_actual: stockDespues,
      },
      { transaction: t }
    );

    await t.commit();

    await registrarAuditoria({
      id_usuario: contexto.usuarioId || 1,
      accion: "KARDEX_REGISTRAR_SALIDA",
      modulo: "kardex",
      detalles: {
        insumo_id: insumo.id,
        movimiento_id: movimiento.id,
        cantidad,
        stock_antes: stockAntes,
        stock_despues: stockDespues,
        subtipo: payload.tipo_salida || "tratamiento",
      },
      ip: contexto.ip,
    });

    await recalcularAlertasSafe();

    return movimiento;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function registrarAjuste(payload, contexto = {}) {
  const t = await sequelize.transaction();

  try {
    const cantidad = Number(payload.cantidad || 0);
    const tipoAjuste = payload.tipo_ajuste;

    if (cantidad <= 0) {
      const error = new Error("La cantidad debe ser mayor a 0");
      error.status = 400;
      throw error;
    }

    if (!["incremento", "decremento"].includes(tipoAjuste)) {
      const error = new Error("tipo_ajuste debe ser incremento o decremento");
      error.status = 400;
      throw error;
    }

    if (!payload.motivo) {
      const error = new Error("El motivo del ajuste es obligatorio");
      error.status = 400;
      throw error;
    }

    const insumo = await Material.findByPk(payload.insumo_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
      attributes: ["id", "nombre", "cantidad_actual"],
    });

    if (!insumo) {
      const error = new Error("Insumo no encontrado");
      error.status = 404;
      throw error;
    }

    const stockAntes = Number(insumo.cantidad_actual || 0);

    if (tipoAjuste === "decremento" && cantidad > stockAntes) {
      const error = new Error(`Stock insuficiente. Stock actual: ${stockAntes}`);
      error.status = 400;
      throw error;
    }

    const stockDespues =
      tipoAjuste === "incremento" ? stockAntes + cantidad : stockAntes - cantidad;

    const movimiento = await MovimientoInventario.create(
      {
        id_insumo: insumo.id,
        tipo_movimiento: "ajuste",
        subtipo: tipoAjuste === "incremento" ? "ajuste_incremento" : "ajuste_decremento",
        cantidad,
        stock_antes: stockAntes,
        stock_despues: stockDespues,
        fecha_movimiento: payload.fecha || new Date(),
        motivo: payload.motivo,
        notas: payload.notas || null,
        usuario_registra: contexto.usuarioId || 1,
      },
      { transaction: t }
    );

    await insumo.update(
      {
        cantidad_actual: stockDespues,
      },
      { transaction: t }
    );

    await t.commit();

    await registrarAuditoria({
      id_usuario: contexto.usuarioId || 1,
      accion: "KARDEX_REGISTRAR_AJUSTE",
      modulo: "kardex",
      detalles: {
        insumo_id: insumo.id,
        movimiento_id: movimiento.id,
        cantidad,
        tipo_ajuste: tipoAjuste,
        stock_antes: stockAntes,
        stock_despues: stockDespues,
      },
      ip: contexto.ip,
    });

    await recalcularAlertasSafe();

    return movimiento;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

function calcularStockRevertido(material, movimiento) {
  const stockActual = Number(material.cantidad_actual || 0);

  if (movimiento.tipo_movimiento === "entrada") {
    return stockActual - Number(movimiento.cantidad || 0);
  }

  if (movimiento.tipo_movimiento === "salida") {
    return stockActual + Number(movimiento.cantidad || 0);
  }

  if (movimiento.tipo_movimiento === "ajuste") {
    const fueIncremento =
      Number(movimiento.stock_despues || 0) > Number(movimiento.stock_antes || 0);

    return fueIncremento
      ? stockActual - Number(movimiento.cantidad || 0)
      : stockActual + Number(movimiento.cantidad || 0);
  }

  return stockActual;
}

async function eliminarMovimiento(id, justificacion, contexto = {}) {
  if (!justificacion || !String(justificacion).trim()) {
    const error = new Error("La justificación es obligatoria");
    error.status = 400;
    throw error;
  }

  const t = await sequelize.transaction();

  try {
    const movimiento = await MovimientoInventario.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!movimiento || movimiento.eliminado) {
      const error = new Error("Movimiento no encontrado");
      error.status = 404;
      throw error;
    }

    const insumo = await Material.findByPk(movimiento.id_insumo, {
      transaction: t,
      lock: t.LOCK.UPDATE,
      attributes: ["id", "cantidad_actual"],
    });

    if (!insumo) {
      const error = new Error("Insumo no encontrado");
      error.status = 404;
      throw error;
    }

    const stockRevertido = calcularStockRevertido(insumo, movimiento);

    if (stockRevertido < 0) {
      const error = new Error("No se puede eliminar porque el stock resultante sería negativo");
      error.status = 400;
      throw error;
    }

    await MovimientoEliminado.create(
      {
        movimiento_id: movimiento.id,
        datos_movimiento: JSON.stringify(movimiento.toJSON()),
        justificacion: String(justificacion).trim(),
        eliminado_por: contexto.usuarioId || 1,
        fecha_eliminacion: new Date(),
      },
      { transaction: t }
    );

    await movimiento.update(
      {
        eliminado: true,
        notas: `${movimiento.notas || ""}\n[ELIMINADO] ${String(justificacion).trim()}`.trim(),
      },
      { transaction: t }
    );

    await insumo.update(
      {
        cantidad_actual: stockRevertido,
      },
      { transaction: t }
    );

    await t.commit();

    await registrarAuditoria({
      id_usuario: contexto.usuarioId || 1,
      accion: "KARDEX_ELIMINAR_MOVIMIENTO",
      modulo: "kardex",
      detalles: {
        movimiento_id: movimiento.id,
        insumo_id: movimiento.id_insumo,
        justificacion,
        stock_resultante: stockRevertido,
      },
      ip: contexto.ip,
    });

    await recalcularAlertasSafe();

    return {
      ok: true,
      movimiento_id: movimiento.id,
      stock_resultante: stockRevertido,
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function exportarMovimientosCSV(query = {}) {
  const resultado = await listarMovimientos({
    ...query,
    pagina: 1,
    limite: 5000,
  });

  const rows = resultado.data || [];

  const header = [
    "Fecha",
    "Tipo",
    "Subtipo",
    "Insumo",
    "Cantidad",
    "Stock Antes",
    "Stock Despues",
    "Costo Unitario",
    "Costo Total",
    "Proveedor",
    "Factura",
    "Motivo",
    "Notas",
  ];

  const lines = [header.map(escapeCsv).join(",")];

  for (const item of rows) {
    lines.push(
      [
        item.fecha_movimiento,
        item.tipo_movimiento,
        item.subtipo,
        item.insumo?.nombre,
        item.cantidad,
        item.stock_antes,
        item.stock_despues,
        item.costo_unitario,
        item.costo_total,
        item.proveedor,
        item.factura,
        item.motivo,
        item.notas,
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  return lines.join("\n");
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
  exportarMovimientosCSV,
};