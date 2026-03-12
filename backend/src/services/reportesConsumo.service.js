const { Op, fn, col, literal } = require("sequelize");
const { Material, MovimientoInventario } = require("../models");

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getPeriodo(query = {}) {
  const now = new Date();
  const mes = num(query.mes, now.getMonth() + 1);
  const anio = num(query.anio, now.getFullYear());
  return { mes, anio };
}

function getMonthRange(anio, mes) {
  const start = new Date(anio, mes - 1, 1, 0, 0, 0, 0);
  const end = new Date(anio, mes, 0, 23, 59, 59, 999);
  return { start, end };
}

function getPreviousMonth(anio, mes) {
  if (mes === 1) return { mes: 12, anio: anio - 1 };
  return { mes: mes - 1, anio };
}

function getLastMonths(anio, mes, count) {
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(anio, mes - 1 - i, 1);
    months.push({
      anio: d.getFullYear(),
      mes: d.getMonth() + 1,
      label: d.toLocaleDateString("es-HN", { month: "short" }).toUpperCase(),
    });
  }
  return months;
}

function variacion(actual, anterior) {
  const a = num(actual);
  const b = num(anterior);
  if (b === 0) return a === 0 ? 0 : 100;
  return ((a - b) / b) * 100;
}

function prioridad(stockActual, stockMinimo) {
  const actual = num(stockActual);
  const minimo = Math.max(1, num(stockMinimo, 1));

  if (actual < minimo) return "critico";
  if (actual <= minimo * 1.5) return "alerta";
  return "normal";
}

function diasEstimados(stockActual, consumoPromedioMensual) {
  const consumoDiario = num(consumoPromedioMensual) / 30;
  if (consumoDiario <= 0) return null;
  return stockActual / consumoDiario;
}

async function listarCategorias() {
  const rows = await Material.findAll({
    attributes: [[fn("DISTINCT", col("categoria")), "categoria"]],
    raw: true,
  });

  return rows
    .map((r) => r.categoria)
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b), "es"));
}

async function getConsumoRangoPorInsumo({ desde, hasta, categoria }) {
  const rows = await MovimientoInventario.findAll({
    attributes: [
      "id_insumo",
      [fn("SUM", col("MovimientoInventario.cantidad")), "total_consumo"],
    ],
    include: [
      {
        model: Material,
        as: "insumo",
        attributes: [],
        required: true,
        where:
          categoria && categoria !== "TODAS"
            ? { categoria }
            : undefined,
      },
    ],
    where: {
      eliminado: false,
      tipo_movimiento: "salida",
      fecha_movimiento: {
        [Op.between]: [desde, hasta],
      },
    },
    group: ["MovimientoInventario.id_insumo"],
    raw: true,
  });

  const map = new Map();
  for (const row of rows) {
    map.set(num(row.id_insumo), num(row.total_consumo));
  }
  return map;
}

async function getConsumoMesPorCategoria({ anio, mes, categoria }) {
  const { start, end } = getMonthRange(anio, mes);

  const rows = await MovimientoInventario.findAll({
    attributes: [
      [col("insumo.categoria"), "categoria"],
      [fn("SUM", col("MovimientoInventario.cantidad")), "total_consumo"],
    ],
    include: [
      {
        model: Material,
        as: "insumo",
        attributes: [],
        required: true,
        where:
          categoria && categoria !== "TODAS"
            ? { categoria }
            : undefined,
      },
    ],
    where: {
      eliminado: false,
      tipo_movimiento: "salida",
      fecha_movimiento: {
        [Op.between]: [start, end],
      },
    },
    group: ["insumo.categoria"],
    raw: true,
  });

  const result = {};
  for (const row of rows) {
    const cat = row.categoria || "Sin categoría";
    result[cat] = num(row.total_consumo);
  }
  return result;
}

async function getPromedioTresMesesPorInsumo({ anio, mes, categoria }) {
  const months = getLastMonths(anio, mes, 3);
  const desde = new Date(months[0].anio, months[0].mes - 1, 1, 0, 0, 0, 0);
  const { end: hasta } = getMonthRange(anio, mes);

  const totalMap = await getConsumoRangoPorInsumo({
    desde,
    hasta,
    categoria,
  });

  const avgMap = new Map();
  for (const [insumoId, total] of totalMap.entries()) {
    avgMap.set(insumoId, total / 3);
  }

  return avgMap;
}

async function obtenerMaterialesCriticos(query = {}) {
  const { mes, anio } = getPeriodo(query);
  const categoria = query.categoria || "TODAS";
  const promedioMap = await getPromedioTresMesesPorInsumo({ anio, mes, categoria });

  const materiales = await Material.findAll({
    where:
      categoria && categoria !== "TODAS"
        ? { categoria }
        : undefined,
    order: [["nombre", "ASC"]],
    raw: true,
  });

  const data = materiales.map((m) => {
    const consumoPromedio = num(promedioMap.get(num(m.id)), 0);
    const stockActual = num(m.cantidad_actual);
    const stockMinimo = num(m.stock_minimo);
    const level = prioridad(stockActual, stockMinimo);
    const dias = diasEstimados(stockActual, consumoPromedio);

    return {
      id: m.id,
      codigo: m.codigo,
      insumo: m.nombre,
      categoria: m.categoria,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
      consumo_promedio: consumoPromedio,
      dias_estimados: dias,
      prioridad: level,
      costo_promedio: num(m.costo_promedio),
    };
  });

  const order = { critico: 1, alerta: 2, normal: 3 };

  data.sort((a, b) => {
    const prio = order[a.prioridad] - order[b.prioridad];
    if (prio !== 0) return prio;

    const diasA = a.dias_estimados ?? Number.MAX_SAFE_INTEGER;
    const diasB = b.dias_estimados ?? Number.MAX_SAFE_INTEGER;
    if (diasA !== diasB) return diasA - diasB;

    return String(a.insumo).localeCompare(String(b.insumo), "es");
  });

  return {
    periodo: { mes, anio },
    data,
  };
}

async function obtenerConsumoMensual(query = {}) {
  const { mes, anio } = getPeriodo(query);
  const categoria = query.categoria || "TODAS";
  const prev = getPreviousMonth(anio, mes);

  const [actualMap, anteriorMap] = await Promise.all([
    getConsumoMesPorCategoria({ anio, mes, categoria }),
    getConsumoMesPorCategoria({ anio: prev.anio, mes: prev.mes, categoria }),
  ]);

  const categorias = Array.from(
    new Set([...Object.keys(actualMap), ...Object.keys(anteriorMap)])
  ).sort((a, b) => a.localeCompare(b, "es"));

  const tabla = categorias.map((cat) => {
    const actual = num(actualMap[cat]);
    const anterior = num(anteriorMap[cat]);
    const cambio = variacion(actual, anterior);

    return {
      categoria: cat,
      consumo_actual: actual,
      consumo_anterior: anterior,
      variacion: cambio,
      tendencia: cambio > 0 ? "up" : cambio < 0 ? "down" : "flat",
    };
  });

  return {
    periodo: { mes, anio },
    comparado_con: prev,
    chart: tabla.map((item) => ({
      categoria: item.categoria,
      total: item.consumo_actual,
    })),
    tabla,
  };
}

async function obtenerTendenciasSeisMeses(query = {}) {
  const { mes, anio } = getPeriodo(query);
  const categoriaFiltro = query.categoria || "TODAS";
  const months = getLastMonths(anio, mes, 6);
  const desde = new Date(months[0].anio, months[0].mes - 1, 1, 0, 0, 0, 0);
  const { end: hasta } = getMonthRange(anio, mes);

  const rows = await MovimientoInventario.findAll({
    attributes: [
      [fn("YEAR", col("fecha_movimiento")), "anio"],
      [fn("MONTH", col("fecha_movimiento")), "mes"],
      [col("insumo.categoria"), "categoria"],
      [fn("SUM", col("MovimientoInventario.cantidad")), "total_consumo"],
    ],
    include: [
      {
        model: Material,
        as: "insumo",
        attributes: [],
        required: true,
        where:
          categoriaFiltro && categoriaFiltro !== "TODAS"
            ? { categoria: categoriaFiltro }
            : undefined,
      },
    ],
    where: {
      eliminado: false,
      tipo_movimiento: "salida",
      fecha_movimiento: {
        [Op.between]: [desde, hasta],
      },
    },
    group: [
      literal("YEAR(fecha_movimiento)"),
      literal("MONTH(fecha_movimiento)"),
      literal("insumo.categoria"),
    ],
    raw: true,
  });

  const categoriesSet = new Set(rows.map((r) => r.categoria || "Sin categoría"));
  const categories = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, "es"));

  const chart = months.map((m) => {
    const point = { mes: m.label };
    for (const cat of categories) point[cat] = 0;

    rows.forEach((r) => {
      if (num(r.anio) === m.anio && num(r.mes) === m.mes) {
        const cat = r.categoria || "Sin categoría";
        point[cat] = num(r.total_consumo);
      }
    });

    return point;
  });

  let totalPrimero = 0;
  let totalUltimo = 0;

  if (chart.length > 0) {
    totalPrimero = Object.keys(chart[0])
      .filter((k) => k !== "mes")
      .reduce((acc, key) => acc + num(chart[0][key]), 0);

    totalUltimo = Object.keys(chart[chart.length - 1])
      .filter((k) => k !== "mes")
      .reduce((acc, key) => acc + num(chart[chart.length - 1][key]), 0);
  }

  const tendenciaGeneral =
    totalUltimo > totalPrimero ? "Aumento gradual" :
    totalUltimo < totalPrimero ? "Disminución gradual" :
    "Estable";

  let mesMayor = null;
  let consumoMayor = -1;

  chart.forEach((p) => {
    const total = Object.keys(p)
      .filter((k) => k !== "mes")
      .reduce((acc, key) => acc + num(p[key]), 0);

    if (total > consumoMayor) {
      consumoMayor = total;
      mesMayor = p.mes;
    }
  });

  let categoriaMayorCrecimiento = null;
  let crecimientoMax = -Infinity;

  for (const cat of categories) {
    const inicial = num(chart[0]?.[cat]);
    const final = num(chart[chart.length - 1]?.[cat]);
    const delta = final - inicial;
    if (delta > crecimientoMax) {
      crecimientoMax = delta;
      categoriaMayorCrecimiento = cat;
    }
  }

  return {
    periodo: { mes, anio },
    categorias: categories,
    chart,
    resumen: {
      tendencia_general: tendenciaGeneral,
      mes_mayor_consumo: mesMayor,
      categoria_mayor_crecimiento: categoriaMayorCrecimiento,
    },
  };
}

async function obtenerSugerenciaCompra(query = {}) {
  const { mes, anio } = getPeriodo(query);
  const categoria = query.categoria || "TODAS";
  const mesesCobertura = num(query.meses_cobertura, 2.5);

  const promedioMap = await getPromedioTresMesesPorInsumo({ anio, mes, categoria });

  const materiales = await Material.findAll({
    where:
      categoria && categoria !== "TODAS"
        ? { categoria }
        : undefined,
    order: [["nombre", "ASC"]],
    raw: true,
  });

  const data = materiales
    .map((m) => {
      const consumoPromedio = num(promedioMap.get(num(m.id)), 0);
      const stockActual = num(m.cantidad_actual);
      const puntoReorden = consumoPromedio * mesesCobertura;

      if (consumoPromedio <= 0 || stockActual >= puntoReorden) {
        return null;
      }

      const cantidadSugerida = Math.ceil(puntoReorden - stockActual);
      const costoUnitario = num(m.costo_promedio);
      const costoTotal = cantidadSugerida * costoUnitario;

      return {
        id: m.id,
        codigo: m.codigo,
        insumo: m.nombre,
        categoria: m.categoria,
        consumo_promedio: consumoPromedio,
        stock_actual: stockActual,
        recomendacion: cantidadSugerida,
        costo_unitario: costoUnitario,
        costo_total: costoTotal,
        meses_cobertura: mesesCobertura,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.costo_total - a.costo_total);

  const total_estimado = data.reduce((acc, item) => acc + num(item.costo_total), 0);

  return {
    periodo: { mes, anio },
    meses_cobertura: mesesCobertura,
    total_estimado,
    data,
  };
}

async function obtenerComparativaMensual(query = {}) {
  const { tabla, periodo, comparado_con } = await obtenerConsumoMensual(query);

  const totalActual = tabla.reduce((acc, item) => acc + num(item.consumo_actual), 0);
  const totalAnterior = tabla.reduce((acc, item) => acc + num(item.consumo_anterior), 0);
  const variacionGeneral = variacion(totalActual, totalAnterior);

  let mayorAumento = null;
  let mayorDisminucion = null;

  tabla.forEach((item) => {
    if (!mayorAumento || item.variacion > mayorAumento.variacion) {
      mayorAumento = item;
    }
    if (!mayorDisminucion || item.variacion < mayorDisminucion.variacion) {
      mayorDisminucion = item;
    }
  });

  return {
    periodo,
    comparado_con,
    variacion_general: variacionGeneral,
    mayor_aumento: mayorAumento,
    mayor_disminucion: mayorDisminucion,
    detalle: tabla,
  };
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function exportarReporte(query = {}) {
  const tipo = query.tipo_reporte || "materiales-criticos";
  const formato = (query.formato || "excel").toLowerCase();

  let rows = [];
  let headers = [];

  if (tipo === "materiales-criticos") {
    const result = await obtenerMaterialesCriticos(query);
    headers = ["Prioridad", "Insumo", "Categoría", "Stock Actual", "Stock Mínimo", "Consumo Promedio", "Días Estimados"];
    rows = result.data.map((r) => [
      r.prioridad,
      r.insumo,
      r.categoria,
      r.stock_actual,
      r.stock_minimo,
      r.consumo_promedio,
      r.dias_estimados ?? "",
    ]);
  } else if (tipo === "consumo-mensual") {
    const result = await obtenerConsumoMensual(query);
    headers = ["Categoría", "Consumo Actual", "Consumo Anterior", "Variación"];
    rows = result.tabla.map((r) => [
      r.categoria,
      r.consumo_actual,
      r.consumo_anterior,
      r.variacion,
    ]);
  } else if (tipo === "tendencias-6-meses") {
    const result = await obtenerTendenciasSeisMeses(query);
    headers = ["Mes", ...result.categorias];
    rows = result.chart.map((r) => [
      r.mes,
      ...result.categorias.map((cat) => r[cat] ?? 0),
    ]);
  } else if (tipo === "sugerencia-compra") {
    const result = await obtenerSugerenciaCompra(query);
    headers = ["Insumo", "Categoría", "Consumo Promedio", "Stock Actual", "Recomendación", "Costo Unitario", "Costo Total"];
    rows = result.data.map((r) => [
      r.insumo,
      r.categoria,
      r.consumo_promedio,
      r.stock_actual,
      r.recomendacion,
      r.costo_unitario,
      r.costo_total,
    ]);
  } else {
    const error = new Error("Tipo de reporte no soportado");
    error.status = 400;
    throw error;
  }

  const csv = [headers, ...rows]
    .map((line) => line.map(csvEscape).join(","))
    .join("\n");

  if (formato === "pdf") {
    const error = new Error("La exportación PDF queda para la siguiente fase. Excel/CSV ya está funcional.");
    error.status = 400;
    throw error;
  }

  return {
    filename: `${tipo}.csv`,
    mimeType: "text/csv; charset=utf-8",
    content: csv,
  };
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