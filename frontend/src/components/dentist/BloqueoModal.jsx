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

/**
 * BloqueoModal - Componente profesional para la gestión de bloqueos de agenda.
 * Mantiene la compatibilidad con el sistema de estilos dm17 y la lógica de FullCalendar.
 */
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

  // Limpiar el formulario y estados al abrir/cerrar el modal
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

  /**
   * Maneja el envío del formulario procesando los datos para evitar
   * solapamientos visuales en el calendario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Normalización de datos para compatibilidad con FullCalendar
      const datosFinales = {
        ...form,
        id_dentista: idDentista,
        // Si es todo el día, enviamos null en horas para que el backend/calendario 
        // lo reconozca como un evento de jornada completa sin rayas diagonales.
        hora_inicio: form.todo_el_dia ? "00:00" : form.hora_inicio,
        hora_fin: form.todo_el_dia ? "23:59" : form.hora_fin
      };

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
      <div className="dm17-modal" style={{ maxWidth: "550px" }}>
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

            {/* ========== DÍA COMPLETO - DISEÑO PROFESIONAL MANTENIDO ========== */}
            <div className="dm17-field dm17-field-full" style={{ 
              marginBottom: "16px",
              marginTop: "8px"
            }}>
              <div style={{
                background: "#f8fafc",
                borderRadius: "12px",
                padding: "14px 18px",
                border: "1px solid #cbd5e1",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.borderColor = "#94a3b8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onClick={() => setForm(prev => ({ ...prev, todo_el_dia: !prev.todo_el_dia }))}
              >
                <input
                  type="checkbox"
                  id="todo_el_dia"
                  name="todo_el_dia"
                  checked={form.todo_el_dia}
                  onChange={handleChange}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                    accentColor: "#4f46e5",
                    margin: 0,
                    flexShrink: 0
                  }}
                />
                <label htmlFor="todo_el_dia" className="dentista-label" style={{ fontWeight: "600", color: "#1e293b", cursor: "pointer", margin: 0, flex: 1 }}>
                  Bloquear día completo
                </label>
                <span className="dentista-texto-xpequeno" style={{ background: "#e2e8f0", padding: "4px 10px", borderRadius: "4px", fontWeight: "600", color: "#475569", letterSpacing: "0.3px" }}>
                  24 HORAS
                </span>
              </div>
            </div>

            {/* Gestión dinámica de horas */}
            {!form.todo_el_dia && (
              <>
                <div className="dm17-field">
                  <label>Hora Inicio</label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={form.hora_inicio}
                    onChange={handleChange}
                    required={!form.todo_el_dia}
                    style={{
                      transition: "all 0.2s ease",
                      animation: "fadeIn 0.2s ease"
                    }}
                  />
                </div>

                <div className="dm17-field">
                  <label>Hora Fin</label>
                  <input
                    type="time"
                    name="hora_fin"
                    value={form.hora_fin}
                    onChange={handleChange}
                    required={!form.todo_el_dia}
                    style={{
                      transition: "all 0.2s ease",
                      animation: "fadeIn 0.2s ease"
                    }}
                  />
                </div>
              </>
            )}

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
                style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    resize: 'none',
                    fontFamily: 'inherit'
                }}
              ></textarea>
            </div>
          </div>

          {error && (
            <div className="dm17-error dentista-label" style={{ color: '#dc3545', marginTop: '10px', fontWeight: '500' }}>
                <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

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
              style={{ 
                background: "linear-gradient(90deg, #4f46e5, #d42674)",
                color: "white",
                border: "none",
                fontWeight: "600",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.8 : 1
              }}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Guardando...
                </>
              ) : "Crear Bloqueo"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dm17-btn:disabled {
          filter: grayscale(0.5);
        }
      `}</style>
    </div>
  );
}