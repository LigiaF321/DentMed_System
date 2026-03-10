import api from "./api";

export async function checkDentistEmailExists() {
  return { exists: false };
}

export async function createDentistAccount(payload) {
  const { data } = await api.post("/admin/dentistas", payload);
  return data;
}

// Obtener registros de auditoría con filtros
export async function getAuditRecords(params = {}) {
  const { data } = await api.get("/admin/auditoria", { params });
  return data;
}

// Obtener detalle de registro específico
export async function getAuditRecordById(id) {
  const { data } = await api.get(`/admin/auditoria/${id}`);
  return data;
}

// Obtener estadísticas para encabezado
export async function getAuditStats() {
  const { data } = await api.get("/admin/auditoria/estadisticas");
  return data;
}

// Obtener lista de usuarios para filtros
export async function getAuditUsers() {
  const { data } = await api.get("/admin/auditoria/usuarios");
  return data;
}

// Obtener lista de acciones para filtros
export async function getAuditActions() {
  const { data } = await api.get("/admin/auditoria/acciones");
  return data;
}

// Obtener todas las opciones de filtros
export async function getAuditFilterOptions() {
  const { data } = await api.get("/admin/auditoria/filtros-opciones");
  return data;
}

// Obtener datos para gráfico de línea de tiempo
export async function getAuditTimeline(usuario_id) {
  const { data } = await api.get(`/admin/auditoria/linea-tiempo/${usuario_id}`);
  return data;
}

// Exportar auditoría a CSV o PDF
export async function exportAudit(format = "csv", params = {}) {
  const { data } = await api.get("/admin/auditoria/exportar", {
    params: { ...params, format },
    responseType: format === "pdf" ? "blob" : "arraybuffer"
  });
  return data;
}