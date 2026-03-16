import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Función apiCall para llamadas HTTP con manejo de errores
export const apiCall = async (endpoint, method = 'GET', data = null, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const config = {
      method,
      url: endpoint,
      ...options,
      headers: {
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await api(config);
    return response.data;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);

    if (error.response) {
      // Error del servidor
      const message = error.response.data?.message || `Error ${error.response.status}`;
      throw new Error(message);
    } else if (error.request) {
      // Error de red
      throw new Error('Error de conexión. Verifica tu conexión a internet.');
    } else {
      // Otro error
      throw new Error(error.message || 'Error desconocido');
    }
  }
};

export default api;