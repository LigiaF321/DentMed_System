const NodeCache = require('node-cache');
const cache = new NodeCache();

// Estadísticas: caché 1 hora
async function getCachedStats(key, fetchFn) {
  const cached = cache.get(key);
  if (cached) return cached;
  const data = await fetchFn();
  cache.set(key, data, 3600); // 1 hora
  return data;
}

// Listas de filtros: caché 1 día
async function getCachedFilters(key, fetchFn) {
  const cached = cache.get(key);
  if (cached) return cached;
  const data = await fetchFn();
  cache.set(key, data, 86400); // 1 día
  return data;
}

module.exports = { getCachedStats, getCachedFilters };
