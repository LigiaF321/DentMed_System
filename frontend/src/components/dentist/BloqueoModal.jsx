import React, { useState, useEffect } from "react";
import "./NuevaCitaModal.css"; 

const TIPOS_BLOQUEO = [
  { id: "procedimiento_largo", label: "Procedimiento largo" },
  { id: "reunion", label: "Reunión" },
  { id: "ausencia", label: "Ausencia" },
  { id: "personal", label: "Personal" },
];

const RECURRENCIAS = [
  { id: "ninguna", label: "Ninguna" },
  { id: "diaria", label: "Diaria" },
  { id: "semanal", label: "Semanal" },
  { id: "mensual", label: "Mensual" },
];

// Corregido: Ahora recibe isOpen para coincidir con el Dashboard
export default function BloqueoModal({ isOpen, onClose, onSave, idDentista }) {
  const [form, setForm] = useState({
    tipo: "personal",
    fecha: new Date().toISOString().split("T")[0],
    hora_inicio: "",
    hora_fin: "",
    todo_el_dia: false,
    recurrencia: "ninguna",
    descripcion: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Limpiar el formulario cada vez que se abre el modal usando isOpen
  useEffect(() => {
    if (isOpen) {
      setError("");
      setSaving(false);
      setForm({
        tipo: "personal",
        fecha: new Date().toISOString().split("T")[0],
        hora_inicio: "",
        hora_fin: "",
        todo_el_dia: false,
        recurrencia: "ninguna",
        descripcion: "",
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Preparar objeto final con el id del dentista
      const datosFinales = {
        ...form,
        id_dentista: idDentista,
        // Si es todo el día, enviamos rango completo para evitar errores en BD
        hora_inicio: form.todo_el_dia ? "00:00" : form.hora_inicio,
        hora_fin: form.todo_el_dia ? "23:59" : form.hora_fin
      };

      // Ejecutar la función onSave que viene del Dashboard
      if (onSave) {
        await onSave(datosFinales);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || "Error al crear el bloqueo");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dm17-overlay">
      <div className="dm17-modal">
        <div className="dm17-modal-header">
          <h3><i className="fas fa-lock"></i> Bloquear Horario</h3>
          <button type="button" className="dm17-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="dm17-form" onSubmit={handleSubmit}>
          <div className="dm17-grid">
            <div className="dm17-field">
              <label>Tipo de bloqueo</label>
              <select name="tipo" value={form.tipo} onChange={handleChange}>
                {TIPOS_BLOQUEO.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="dm17-field">
              <label>Fecha</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                required
              />
            </div>

            <div className="dm17-field">
              <label>Hora Inicio</label>
              <input
                type="time"
                name="hora_inicio"
                value={form.hora_inicio}
                onChange={handleChange}
                disabled={form.todo_el_dia}
                required={!form.todo_el_dia}
              />
            </div>

            <div className="dm17-field">
              <label>Hora Fin</label>
              <input
                type="time"
                name="hora_fin"
                value={form.hora_fin}
                onChange={handleChange}
                disabled={form.todo_el_dia}
                required={!form.todo_el_dia}
              />
            </div>

            <div className="dm17-field dm17-field-full" style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="todo_el_dia"
                name="todo_el_dia"
                checked={form.todo_el_dia}
                onChange={handleChange}
              />
              <label htmlFor="todo_el_dia" style={{ marginBottom: 0 }}>Bloquear día completo</label>
            </div>

            <div className="dm17-field">
              <label>Recurrencia</label>
              <select name="recurrencia" value={form.recurrencia} onChange={handleChange}>
                {RECURRENCIAS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="dm17-field dm17-field-full">
              <label>Descripción / Notas</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Indique el motivo del bloqueo..."
                rows="2"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              ></textarea>
            </div>
          </div>

          {error && <div className="dm17-error" style={{ color: '#dc3545', marginTop: '10px' }}>{error}</div>}

          <div className="dm17-actions">
            <button
              type="button"
              className="dm17-btn dm17-btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="dm17-btn dm17-btn-primary"
              disabled={saving}
              style={{ backgroundColor: '#9b59b6', color: 'white', border: 'none' }} 
            >
              {saving ? "Guardando..." : "Crear Bloqueo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}