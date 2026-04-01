import api from "./api";

/**
 * Registra una acción de auditoría relacionada con consultorios.
 * @param {Object} payload - Datos de auditoría (accion, modulo, detalle, resultado, etc)
 * @returns {Promise<Object>} Respuesta del backend
 */
export async function registrarAuditoriaConsultorio(payload) {
  // El endpoint esperado es /api/auditoria/consultorios
  const { data } = await api.post("/auditoria/consultorios", payload);
  return data;
}
