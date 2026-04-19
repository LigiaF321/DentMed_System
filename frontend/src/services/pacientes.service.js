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
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Su sesión ha expirado. Por favor, recargue la página y vuelva a iniciar sesión.');
    }
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
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Su sesión ha expirado. Por favor, recargue la página y vuelva a iniciar sesión.');
    }
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
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Su sesión ha expirado. Por favor, recargue la página y vuelva a iniciar sesión.');
    }
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
    // Si es 401 (Token inválido), limpiar la sesión
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Su sesión ha expirado. Por favor, recargue la página y vuelva a iniciar sesión.');
    }
    throw new Error(data?.message || 'Error al crear paciente rápido');
  }

  return data;
};

export const actualizarPaciente = async (id, payload) => {
  const response = await fetch(`${API_URL}/pacientes/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    console.warn('Respuesta no JSON de actualizarPaciente:', text);
  }

  if (!response.ok) {
    const plainText = String(text || '').trim();
    const cannotPut = plainText.includes(`Cannot PUT /api/pacientes/${id}`);
    const message = cannotPut
      ? 'El endpoint para actualizar pacientes no está disponible en el backend en ejecución. Reinicia el servidor backend y verifica que cargó la ruta PUT /api/pacientes/:id.'
      : (data && data.message) || plainText || 'Error al actualizar paciente';
    throw new Error(message);
  }

  return data;
};
