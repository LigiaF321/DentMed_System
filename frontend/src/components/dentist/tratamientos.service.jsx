const getToken = () => localStorage.getItem('token') || '';

const BASE = 'http://localhost:3000/api';

export const crearTratamiento = async (payload) => {
  const res = await fetch(`${BASE}/tratamientos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: payload,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Error al crear tratamiento');
  return data;
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