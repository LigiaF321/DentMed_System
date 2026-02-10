const API_URL = "http://localhost:3000/api/dentistas";

export async function createDentist(dentistData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dentistData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al crear dentista");
  }

  return data;
}
