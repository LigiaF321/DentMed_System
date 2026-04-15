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
  // Paginación
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState(5);

  useEffect(() => {
    if (!open || !cita) return;

    setLoading(true);
    setError("");
    setSelected(null);
    setPagina(1); // Reiniciar página al abrir
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

  // Paginación de consultorios
  const totalPaginas = Math.ceil(consultorios.length / tamanoPagina);
  const consultoriosPagina = consultorios.slice((pagina - 1) * tamanoPagina, pagina * tamanoPagina);

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
            procedimiento={null}
            consultorios={consultoriosPagina}
            loading={loading}
            onSelectConsultorio={setSelected}
            selectedConsultorio={selected}
          />

          {/* Paginación */}
          {consultorios.length > tamanoPagina && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '12px 0' }}>
              <button
                className="dm17-btn"
                disabled={pagina === 1}
                onClick={() => setPagina(p => Math.max(1, p - 1))}
              >Anterior</button>
              <span>Página {pagina} de {totalPaginas}</span>
              <button
                className="dm17-btn"
                disabled={pagina === totalPaginas}
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              >Siguiente</button>
              <select
                value={tamanoPagina}
                onChange={e => { setTamanoPagina(Number(e.target.value)); setPagina(1); }}
                style={{ marginLeft: 8 }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>por página</span>
            </div>
          )}

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