const BASE_URL = "http://localhost:3000";

//  Validar email (ruta del backend de tu compañera)
export async function checkEmailAvailability(email) {
  try {
    const url = `${BASE_URL}/api/auth/dentistas/validar-email?email=${encodeURIComponent(email)}`;
    const res = await fetch(url);

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { error: "Sin conexión" } };
  }
}

// Crear dentista (ajusta si tu backend usa otra ruta distinta)
export async function createDentist(payload) {
  try {
    const res = await fetch(`${BASE_URL}/api/dentistas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { error: "Sin conexión" } };
  }
}