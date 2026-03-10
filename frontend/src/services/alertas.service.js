import api from "./api";

export async function getResumenAlertas() {
  const { data } = await api.get("/admin/alertas/resumen");
  return data;
}

export async function getAlertas(params = {}) {
  const { data } = await api.get("/admin/alertas", { params });
  return data;
}

export async function tratarAlerta(id, payload = {}) {
  const { data } = await api.patch(`/admin/alertas/${id}/tratar`, payload);
  return data;
}

export async function tratarAlertasMasivo(payload = {}) {
  const { data } = await api.post("/admin/alertas/tratar-masivo", payload);
  return data;
}

export async function getConfiguracionAlertas() {
  const { data } = await api.get("/admin/alertas/configuracion");
  return data;
}

export async function updateConfiguracionAlertas(payload = {}) {
  const { data } = await api.put("/admin/alertas/configuracion", payload);
  return data;
}

export async function enviarNotificacionAlertas() {
  const { data } = await api.post("/admin/alertas/enviar-notificacion");
  return data;
}

export async function getHistorialNotificaciones(params = {}) {
  const { data } = await api.get("/admin/alertas/historial-notificaciones", {
    params,
  });
  return data;
}

export async function ejecutarCalculoAlertas() {
  const { data } = await api.post("/admin/alertas/ejecutar-ahora");
  return data;
}