import { getAuthToken } from '../utils/auth';

const API_URL = 'http://localhost:3000/api';

const getHeaders = () => {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const buscarPacientes = async ({ q = '', page = 1, limit = 10, filtros = {} }) => {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
    filtros_json: JSON.stringify(filtros),
  });

  const response = await fetch(`${API_URL}/pacientes/buscar?${params.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Error al buscar pacientes');
  }

  return data;
};

export const obtenerPacienteDetalle = async (id) => {
  const response = await fetch(`${API_URL}/pacientes/${id}?from_search=1`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Error al obtener detalle del paciente');
  }

  return data;
};

export const obtenerPacientesRecientes = async () => {
  const response = await fetch(`${API_URL}/pacientes/recientes`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Error al obtener pacientes recientes');
  }

  return data;
};

export const crearPacienteRapido = async (payload) => {
  const response = await fetch(`${API_URL}/pacientes/crear-rapido`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Error al crear paciente rápido');
  }

  return data;
};