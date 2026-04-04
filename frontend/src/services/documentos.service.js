import axios from "axios";
import api from "./api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const listarDocumentosPaciente = async (idPaciente, filtros = {}) => {
  const params = new URLSearchParams();

  if (filtros.tipo) {
    params.append("tipo", filtros.tipo);
  }

  if (filtros.q) {
    params.append("q", filtros.q);
  }

  const queryString = params.toString();
  const url = queryString
    ? `/pacientes/${idPaciente}/documentos?${queryString}`
    : `/pacientes/${idPaciente}/documentos`;

  const { data } = await api.get(url);
  return data;
};

export const subirDocumentoPaciente = async (idPaciente, payload) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();

  formData.append("archivo", payload.archivo);

  if (payload.tipo_documento) {
    formData.append("tipo_documento", payload.tipo_documento);
  }

  formData.append(
    "etiquetas",
    JSON.stringify(Array.isArray(payload.etiquetas) ? payload.etiquetas : [])
  );

  const { data } = await axios.post(
    `${BASE_URL}/pacientes/${idPaciente}/documentos`,
    formData,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return data;
};

export const eliminarDocumento = async (idDocumento) => {
  const { data } = await api.delete(`/documentos/${idDocumento}`);
  return data;
};

export const descargarDocumento = async (idDocumento, nombreArchivo = "documento") => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${BASE_URL}/documentos/${idDocumento}/descargar`,
    {
      responseType: "blob",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
};

export const obtenerUrlDocumento = (rutaArchivo) => {
  if (!rutaArchivo) return "";

  if (rutaArchivo.startsWith("http")) {
    return rutaArchivo;
  }

  return `http://localhost:3000${rutaArchivo}`;
};