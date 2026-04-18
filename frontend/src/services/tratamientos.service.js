import { getAuthToken } from '../utils/auth';

const API_URL = 'http://localhost:3000/api';

// Función para obtener headers consistentes
const getHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const listarTratamientos = async (params = {}) => {
  const searchParams = new URLSearchParams(params);
  const response = await fetch(`${API_URL}/tratamientos?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Error al obtener tratamientos');
  return data;
};

const getToken = () => localStorage.getItem('token') || '';

const BASE = 'http://localhost:3000/api';

export const crearTratamiento = async (payload) => {
  // CORRECCIÓN VITAL: Si el payload no trae doctorId, intentamos obtenerlo del usuario 
  // para evitar el error 'Tratamiento.doctorId cannot be null'
  if (!payload.doctorId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Nota: El backend que corregimos buscará el ID de dentista 
    // usando este user.id si es necesario.
    if (user.id) {
      payload.doctorId = user.id;
    } else {
      console.error("Error: El doctorId es necesario para guardar el tratamiento.");
    }
  }

  const res = await fetch(`${BASE}/tratamientos`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(payload), 
  });

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await res.json();
    if (!res.ok) {
      // Esto capturará específicamente el error de "doctorId cannot be null" en pantalla
      throw new Error(data?.errors?.[0]?.message || data?.error || data?.message || 'Error al crear tratamiento');
    }
    return data;
  } else {
    const textError = await res.text();
    console.error("Error del servidor (HTML):", textError);
    throw new Error("El servidor devolvió un error de formato (HTML). Revisa la consola.");
  }
};

export const obtenerMateriales = async () => {
  const res = await fetch(`${BASE}/materiales`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Error al obtener materiales');
  return data;
};

export const obtenerTratamientosPaciente = async (pacienteId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(
    `${BASE}/tratamientos/pacientes/${pacienteId}/tratamientos?${query}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Error al obtener tratamientos');
  return data;
};