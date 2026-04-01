import React, { useEffect, useState } from "react";
import ConsultorioSugerido from "./ConsultorioSugerido";
import { actualizarConsultorioCita } from "../../services/citas.service";
import { sugerirConsultorios } from "../../services/consultorios.service";
import { registrarAuditoriaConsultorio } from "../../services/auditoria.service";

const CambiarConsultorioModal = ({ open, onClose, cita, onUpdated }) => {
  const [consultoriosSugeridos, setConsultoriosSugeridos] = useState([]);
  const [sugiriendo, setSugiriendo] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !cita) return;
    setSugiriendo(true);
    setError("");
    setSelected(null);
    sugerirConsultorios(cita.motivo)
      .then(res => setConsultoriosSugeridos(res.data || []))
      .catch(() => setConsultoriosSugeridos([]))
      .finally(() => setSugiriendo(false));
  }, [open, cita]);

  const handleGuardar = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await actualizarConsultorioCita(cita.id, selected.id);
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
          motivo: cita.motivo,
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
        <div className="dm17-modal-header">
          <h3>Cambiar consultorio</h3>
          <button type="button" className="dm17-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="dm17-form">
          <div><b>Procedimiento:</b> {cita.motivo}</div>
          <ConsultorioSugerido
            procedimiento={cita.motivo}
            consultorios={consultoriosSugeridos}
            loading={sugiriendo}
            onSelectConsultorio={setSelected}
          />
          {error && <div className="dm17-error">{error}</div>}
          <div className="dm17-actions">
            <button type="button" className="dm17-btn dm17-btn-secondary" onClick={onClose}>
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
