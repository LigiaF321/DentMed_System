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

export const buscarPacientes = async (q) => {
  const response = await fetch(
    `${API_URL}/pacientes/buscar?q=${encodeURIComponent(q)}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return parseResponse(response);
};

export const crearPacienteRapido = async (payload) => {
  const response = await fetch(`${API_URL}/pacientes`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};