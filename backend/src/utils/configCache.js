const { Configuracion } = require("../models");

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = null;
let cacheAt = 0;

async function loadAll() {
  const rows = await Configuracion.findAll({ where: { activo: true } });
  const map = new Map();
  for (const r of rows) map.set(r.clave, Number(r.valor));
  cache = map;
  cacheAt = Date.now();
  return map;
}

async function getInt(clave, defValue) {
  const now = Date.now();
  if (!cache || now - cacheAt > CACHE_TTL_MS) await loadAll();
  const v = cache.get(clave);
  return Number.isFinite(v) ? v : defValue;
}

function invalidate() {
  cache = null;
  cacheAt = 0;
}

module.exports = { loadAll, getInt, invalidate };