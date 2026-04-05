import api from "./api";

export async function listar(params = {}) {
  const { data } = await api.get("/admin/materiales", { params });
  return data;
}

export async function crear(payload) {
  const { data } = await api.post("/admin/materiales", payload);
  return data;
}

export async function actualizar(id, payload) {
  const { data } = await api.put(`/admin/materiales/${id}`, payload);
  return data;
}

const materialService = {
  listar,
  crear,
  actualizar,
};

export default materialService;
