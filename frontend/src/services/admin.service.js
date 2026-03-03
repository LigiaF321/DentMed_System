import api from "./api";

export async function checkDentistEmailExists() {
  return { exists: false };
}

export async function createDentistAccount(payload) {
  const { data } = await api.post("/admin/dentistas", payload);
  return data;
}