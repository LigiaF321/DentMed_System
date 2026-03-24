import api from "./api";

export async function loginAdmin({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  // Guarda el token en localStorage
  if (data?.token) {
    localStorage.setItem("token", data.token);
  }
  return data;
}
