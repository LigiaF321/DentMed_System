function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });

  return search.toString();
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (data.message || data.error)) ||
      "Ocurrió un error en la petición";
    throw new Error(message);
  }

  return data;
}

export function buscarInsumos(q = "") {
  const qs = buildQuery({ q });
  return request(`/api/admin/kardex/insumos${qs ? `?${qs}` : ""}`);
}

export function getMovimientos(params = {}) {
  const qs = buildQuery(params);
  return request(`/api/admin/kardex/movimientos${qs ? `?${qs}` : ""}`);
}

export function getResumenInsumo(insumoId) {
  return request(`/api/admin/kardex/resumen/${insumoId}`);
}

export function getStockActual(insumoId) {
  return request(`/api/admin/kardex/stock/${insumoId}`);
}

export function validarSalida(params = {}) {
  const qs = buildQuery(params);
  return request(`/api/admin/kardex/validar-salida?${qs}`);
}

export function registrarEntrada(payload) {
  return request("/api/admin/kardex/entrada", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registrarSalida(payload) {
  return request("/api/admin/kardex/salida", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registrarAjuste(payload) {
  return request("/api/admin/kardex/ajuste", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function eliminarMovimiento(id, justificacion) {
  return request(`/api/admin/kardex/movimientos/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ justificacion }),
  });
}

export async function exportarMovimientos(params = {}) {
  const qs = buildQuery(params);
  const res = await fetch(`/api/admin/kardex/exportar${qs ? `?${qs}` : ""}`);

  if (!res.ok) {
    let msg = "No se pudo exportar";
    try {
      const data = await res.json();
      msg = data.message || msg;
    } catch {
      //
    }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kardex_movimientos.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}