import { getAuthToken } from "../utils/auth";

const API_URL = "http://localhost:3000/api";



const getHeaders = () => {
  const token = getAuthToken();
  console.log("TOKEN ADMIN:", token);

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};



const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  if (!contentType.includes("application/json")) {
    console.error("Respuesta no JSON:", rawText);
    throw new Error("El servidor no devolvió JSON.");
  }

  const data = JSON.parse(rawText);

  if (!response.ok) {
    throw new Error(data.message || "Error en la petición");
  }

  return data;
};

export const obtenerConsultoriosAdmin = async () => {
  const response = await fetch(`${API_URL}/admin/consultorios`, {
    method: "GET",
    headers: getHeaders(),
  });

  return parseResponse(response);
};

export const crearConsultorioAdmin = async (payload) => {
  const response = await fetch(`${API_URL}/admin/consultorios`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const actualizarConsultorioAdmin = async (id, payload) => {
  const response = await fetch(`${API_URL}/admin/consultorios/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const eliminarConsultorioAdmin = async (id) => {
  const response = await fetch(`${API_URL}/admin/consultorios/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return parseResponse(response);
};

export const cambiarMantenimientoConsultorioAdmin = async (id, activo) => {
  const response = await fetch(
    `${API_URL}/admin/consultorios/${id}/mantenimiento`,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ activo }),
    }
  );

  return parseResponse(response);
};

export const cambiarEstadoConsultorioAdmin = async (id, estado) => {
  const response = await fetch(`${API_URL}/admin/consultorios/${id}/estado`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ estado }),
  });

  return parseResponse(response);
};

export const obtenerHistorialConsultorioAdmin = async (id) => {
  const response = await fetch(`${API_URL}/admin/consultorios/${id}/historial`, {
    method: "GET",
    headers: getHeaders(),
  });

  return parseResponse(response);
};

