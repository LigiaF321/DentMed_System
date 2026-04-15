import React, { useEffect, useState } from "react";
import ConsultorioSugerido from "./ConsultorioSugerido";
import { actualizarConsultorioCita, verificarDisponibilidad } from "../../services/citas.service";
import { obtenerConsultorios } from "../../services/consultorios.service";
import { registrarAuditoriaConsultorio } from "../../services/auditoria.service";

const CambiarConsultorioModal = ({ open, onClose, cita, onUpdated }) => {
  const [consultorios, setConsultorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !cita) return;

    setLoading(true);
    setError("");
    setSelected(null);

    // 🔥 Traer todos los consultorios
    obtenerConsultorios()
      .then((res) => setConsultorios(res.data || []))
      .catch(() => setConsultorios([]))
      .finally(() => setLoading(false));
  }, [open, cita]);

  const handleGuardar = async () => {
    if (!selected) return;

    setSaving(true);
    setError("");

    try {
      // ⚠️ Evitar seleccionar el mismo consultorio
      if (selected.id === cita.id_consultorio) {
        setError("Ya estás usando ese consultorio");
        setSaving(false);
        return;
      }

      // 🔥 Validar disponibilidad del consultorio seleccionado
      const disponibilidad = await verificarDisponibilidad({
        id_consultorio: selected.id,
        fecha: cita.fecha,
        hora_inicio: cita.hora_inicio,
        hora_fin: cita.hora_fin,
      });

      // ⚠️ Validación segura
      if (!disponibilidad?.data?.disponible) {
        setError("El consultorio no está disponible en ese horario");
        setSaving(false);
        return;
      }

      // 🔥 Actualizar consultorio en la cita
      await actualizarConsultorioCita(cita.id, selected.id);

      // 🔥 Auditoría
      await registrarAuditoriaConsultorio({
        accion: "cambio_consultorio",
        modulo: "Consultorios",
        detalle: `Cambio de consultorio en cita ${cita.id} a consultorio ${selected.nombre} (${selected.id})`,
        resultado: "exito",
        id_usuario: cita.id_dentista || null,
        metadatos: {
          id_cita: cita.id,
          id_consultorio_nuevo: selected.id,
          id_consultorio_anterior: cita.id_consultorio,
        },
      });

      if (onUpdated) onUpdated(selected);
      onClose();

    } catch (err) {
      setError(err.message || "No se pudo cambiar el consultorio");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !cita) return null;

  return (
    <div className="dm17-overlay">
      <div className="dm17-modal">

        {/* Header */}
        <div className="dm17-modal-header">
          <h3>Cambiar consultorio</h3>
          <button
            type="button"
            className="dm17-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="dm17-form">

          {/* ✅ Consultorio actual */}
          <div>
            <b>Consultorio actual:</b>{" "}
            {cita.consultorio_nombre || cita.id_consultorio}
          </div>

          {/* ✅ Lista de consultorios */}
          <ConsultorioSugerido
            procedimiento={null} // ya no se usa
            consultorios={consultorios}
            loading={loading}
            onSelectConsultorio={setSelected}
          />

          {/* Error */}
          {error && <div className="dm17-error">{error}</div>}

          {/* Acciones */}
          <div className="dm17-actions">
            <button
              type="button"
              className="dm17-btn dm17-btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="dm17-btn dm17-btn-primary"
              disabled={!selected || saving}
              onClick={handleGuardar}
            >
              {saving ? "Guardando..." : "Guardar cambio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CambiarConsultorioModal;