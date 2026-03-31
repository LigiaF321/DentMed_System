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

export const verificarDisponibilidad = async (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });

  const response = await fetch(
    `${API_URL}/citas/verificar-disponibilidad?${searchParams.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return parseResponse(response);
};

export const crearCita = async (payload) => {
  const response = await fetch(`${API_URL}/citas`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};