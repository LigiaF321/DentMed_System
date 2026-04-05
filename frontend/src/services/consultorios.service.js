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

// Obtener todos los consultorios
export const obtenerConsultorios = async () => {
  const response = await fetch(`${API_URL}/consultorios`, {
    method: "GET",
    headers: getHeaders(),
  });

  return parseResponse(response);
};

// Obtener disponibilidad de consultorios por fecha/hora/duración
export const obtenerDisponibilidadConsultorios = async ({
  fecha,
  hora,
  duracion,
}) => {
  const query = new URLSearchParams({
    fecha,
    hora,
    duracion: String(duracion),
  }).toString();

  const response = await fetch(
    `${API_URL}/consultorios/disponibilidad?${query}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return parseResponse(response);
};

// Obtener calendario/rango de consultorios
export const obtenerCalendarioConsultorios = async ({
  fecha_inicio,
  fecha_fin,
}) => {
  const query = new URLSearchParams({
    fecha_inicio,
    fecha_fin,
  }).toString();

  const response = await fetch(
    `${API_URL}/consultorios/calendario?${query}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return parseResponse(response);
};

// Sugerir consultorios
export const sugerirConsultorios = async (payload) => {
  let queryString = "";

  if (typeof payload === "string") {
    queryString = new URLSearchParams({
      procedimiento: payload,
    }).toString();
  } else {
    const params = {};

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params[key] = Array.isArray(value) ? JSON.stringify(value) : value;
      }
    });

    queryString = new URLSearchParams(params).toString();
  }

  const response = await fetch(
    `${API_URL}/consultorios/sugerir?${queryString}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return parseResponse(response);
};

// Crear pre-reserva
export const crearPreReserva = async (id_cita, id_consultorio) => {
  const response = await fetch(`${API_URL}/consultorios/pre-reserva`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ id_cita, id_consultorio }),
  });

  return parseResponse(response);
};

// Cambiar consultorio de una cita existente
export const cambiarConsultorioCita = async (idCita, idConsultorioNuevo) => {
  const response = await fetch(
    `${API_URL}/consultorios/citas/${idCita}/consultorio`,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ id_consultorio: idConsultorioNuevo }),
    }
  );

  return parseResponse(response);
};

// Eliminar pre-reserva
export const eliminarPreReserva = async (idPreReserva) => {
  const response = await fetch(
    `${API_URL}/consultorios/pre-reserva/${idPreReserva}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );

  return parseResponse(response);
};

// Auditoría de consultorios
export const registrarAuditoriaConsultorio = async (datos) => {
  const response = await fetch(`${API_URL}/auditoria/consultorios`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(datos),
  });

  return parseResponse(response);
};

// ===============================
// DM26 - EQUIPAMIENTO
// ===============================

// Obtener equipamiento de todos los consultorios o de uno específico
export const obtenerEquipamientoConsultorios = async (idConsultorio = null) => {
  const query = idConsultorio
    ? `?id_consultorio=${encodeURIComponent(idConsultorio)}`
    : "";

  const response = await fetch(
    `${API_URL}/consultorios/equipamiento${query}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return parseResponse(response);
};

// Actualizar equipos de un consultorio
export const actualizarEquiposConsultorio = async (idConsultorio, equipos) => {
  const response = await fetch(
    `${API_URL}/consultorios/${idConsultorio}/equipos`,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ equipos }),
    }
  );

  return parseResponse(response);
};

// Filtrar consultorios por equipo requerido
export const filtrarConsultoriosPorEquipamiento = async (equipoRequerido) => {
  const response = await fetch(
    `${API_URL}/consultorios/filtrar?equipo_requerido=${encodeURIComponent(
      equipoRequerido
    )}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return parseResponse(response);
};