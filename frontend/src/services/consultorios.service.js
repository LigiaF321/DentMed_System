import { getAuthToken } from "../utils/auth";

const API_URL = "http://localhost:3000/api";

const getHeaders = () => {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponse = async (response) => {
  // Sugerir consultorios según procedimiento
  export const sugerirConsultorios = async (procedimiento) => {
    const response = await fetch(`${API_URL}/consultorios/sugerir?procedimiento=${encodeURIComponent(procedimiento)}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return parseResponse(response);
  };
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

export const obtenerConsultorios = async () => {
  const response = await fetch(`${API_URL}/consultorios`, {
    method: "GET",
    headers: getHeaders(),
  });

  return parseResponse(response);
};