const API_URL = "http://localhost:3000/api/dentistas";

export async function createDentist(dentistData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dentistData),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    
  }

  if (!response.ok) {
    const msg =
      data?.error ||
      data?.message ||
      `Error al crear dentista (HTTP ${response.status})`;
    throw new Error(msg);
  }

  return data;
}