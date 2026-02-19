import { apiGet, apiPost } from "./api";

// email check en tiempo real
export async function checkEmailAvailability(email) {
  const res = await apiGet(`/api/admin/usuarios/check-email?email=${encodeURIComponent(email)}`);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// crear cuenta de dentista
export async function createDentist(payload) {
  const res = await apiPost(`/api/admin/dentistas`, payload);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
