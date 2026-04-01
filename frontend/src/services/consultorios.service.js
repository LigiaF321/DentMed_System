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

// --- FUNCIONES DEL SERVICIO ---

// Obtener todos los consultorios (Estructura original)
export const obtenerConsultorios = async () => {
  const response = await fetch(`${API_URL}/consultorios`, {
    method: "GET",
    headers: getHeaders(),
  });
  return parseResponse(response);
};

// B1: Sugerir consultorios según procedimiento
export const sugerirConsultorios = async (procedimiento) => {
  const response = await fetch(`${API_URL}/consultorios/sugerir?procedimiento=${encodeURIComponent(procedimiento)}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return parseResponse(response);
};

// B1 (Variante): Sugerir consultorio según parámetros varios
export const sugerirConsultorio = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/consultorios/sugerencia?${queryString}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return parseResponse(response);
};

// B2: Crear pre-reserva (Expira en 7 días)
export const crearPreReserva = async (id_cita, id_consultorio) => {
  const response = await fetch(`${API_URL}/citas/pre-reserva`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ id_cita, id_consultorio }),
  });
  return parseResponse(response);
};

// B3: Cambiar consultorio de una cita existente
export const cambiarConsultorioCita = async (idCita, idConsultorioNuevo) => {
  const response = await fetch(`${API_URL}/citas/${idCita}/consultorio`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ id_consultorio: idConsultorioNuevo }),
  });
  return parseResponse(response);
};

// B4: Cancelar/Eliminar pre-reserva
export const eliminarPreReserva = async (idPreReserva) => {
  const response = await fetch(`${API_URL}/citas/pre-reserva/${idPreReserva}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return parseResponse(response);
};

// B6: Registrar Auditoría de Consultorios
export const registrarAuditoriaConsultorio = async (datos) => {
  const response = await fetch(`${API_URL}/auditoria/consultorios`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(datos),
  });
  return parseResponse(response);
};