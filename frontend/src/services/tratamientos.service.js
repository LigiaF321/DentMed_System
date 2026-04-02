import { getAuthToken } from '../utils/auth';

const API_URL = 'http://localhost:3000/api';

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
