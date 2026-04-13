// frontend/src/components/dentist/NuevoTratamientoModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { crearTratamiento, obtenerMateriales } from "./tratamientos.service.jsx";
import './NuevoTratamientoModal.css';

// ─── Constantes ───────────────────────────────────────────────────────────────
const FORMAS_PAGO = ['Efectivo', 'Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia', 'Seguro médico', 'Otro'];

const UPPER_LEFT  = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_RIGHT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT  = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_RIGHT = [31, 32, 33, 34, 35, 36, 37, 38];

// ─── Mini Odontograma ─────────────────────────────────────────────────────────
const MiniOdonto = ({ selected, onToggle }) => {
  const Row = ({ teeth }) => (
    <div className="nt-odonto-arch">
      {teeth.slice(0, 8).map(n => (
        <button key={n} type="button"
          className={`nt-tooth-btn ${selected.includes(n) ? 'selected' : ''}`}
          onClick={() => onToggle(n)}>
          {n}
        </button>
      ))}
      <div className="nt-odonto-divider" />
      {teeth.slice(8).map(n => (
        <button key={n} type="button"
          className={`nt-tooth-btn ${selected.includes(n) ? 'selected' : ''}`}
          onClick={() => onToggle(n)}>
          {n}
        </button>
      ))}
    </div>
  );

  return (
    <div className="nt-odonto-wrap">
      <p className="nt-odonto-hint">Haz clic en los dientes afectados</p>
      <Row teeth={[...UPPER_LEFT, ...UPPER_RIGHT]} />
      <div style={{ height: 4 }} />
      <Row teeth={[...LOWER_LEFT, ...LOWER_RIGHT]} />

      {selected.length > 0 && (
        <div className="nt-selected-teeth">
          <span style={{ fontSize: 11, color: '#6b7280' }}>Seleccionados:</span>
          {selected.map(n => (
            <span key={n} className="nt-tooth-chip">
              {n}
              <button type="button" onClick={() => onToggle(n)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function NuevoTratamientoModal({ open, onClose, onCreated, pacienteId }) {
  const [form, setForm] = useState({
    diagnostico: '',
    procedimiento: '',
    dientes: [],
    observaciones: '',
    costo: '',
    forma_pago: 'Efectivo',
    es_multisesion: false,
    sesiones_estimadas: 2,
    estado: 'planificado',
  });

  const [materiales, setMateriales]       = useState([]);       // catálogo
  const [queryMat, setQueryMat]           = useState('');
  const [matSelec, setMatSelec]           = useState([]);        // [{id, nombre, cantidad, unidad}]
  const [archivos, setArchivos]           = useState([]);
  const [dragOver, setDragOver]           = useState(false);
  const [saving, setSaving]              = useState(false);
  const [error, setError]                = useState('');

  const inputFileRef = useRef(null);

  // Cargar catálogo de materiales
  useEffect(() => {
    if (!open) return;
    obtenerMateriales()
      .then(data => setMateriales(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setMateriales([]));
  }, [open]);

  // Reset al abrir
  useEffect(() => {
    if (!open) return;
    setForm({
      diagnostico: '',
      procedimiento: '',
      dientes: [],
      observaciones: '',
      costo: '',
      forma_pago: 'Efectivo',
      es_multisesion: false,
      sesiones_estimadas: 2,
      estado: 'planificado',
    });
    setQueryMat('');
    setMatSelec([]);
    setArchivos([]);
    setDragOver(false);
    setError('');
  }, [open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setError('');
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleDiente = (n) => {
    setForm(prev => ({
      ...prev,
      dientes: prev.dientes.includes(n)
        ? prev.dientes.filter(d => d !== n)
        : [...prev.dientes, n],
    }));
  };

  // ── Materiales ──────────────────────────────────────────────────────────────
  const matFiltrados = materiales.filter(m =>
    m.nombre?.toLowerCase().includes(queryMat.toLowerCase()) &&
    !matSelec.find(s => s.id === m.id)
  );

  const agregarMaterial = (m) => {
    setMatSelec(prev => [...prev, { id: m.id, nombre: m.nombre, unidad: m.unidad || 'unidad', cantidad: 1 }]);
    setQueryMat('');
  };

  const quitarMaterial = (id) => setMatSelec(prev => prev.filter(m => m.id !== id));

  const cambiarCantidad = (id, val) => {
    setMatSelec(prev => prev.map(m => m.id === id ? { ...m, cantidad: Math.max(1, Number(val)) } : m));
  };

  // ── Archivos drag & drop ────────────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setArchivos(prev => [...prev, ...files]);
  }, []);

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    setArchivos(prev => [...prev, ...files]);
  };

  const quitarArchivo = (idx) => setArchivos(prev => prev.filter((_, i) => i !== idx));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.diagnostico.trim()) { setError('El diagnóstico es obligatorio.'); return; }
    if (!form.procedimiento.trim()) { setError('El procedimiento es obligatorio.'); return; }

    try {
      setSaving(true);

      // Construir FormData para poder enviar archivos
      const fd = new FormData();
      fd.append('id_paciente', pacienteId);
      fd.append('diagnostico', form.diagnostico.trim());
      fd.append('procedimiento', form.procedimiento.trim());
      fd.append('dientes', JSON.stringify(form.dientes));
      fd.append('observaciones', form.observaciones.trim());
      fd.append('costo', form.costo || 0);
      fd.append('forma_pago', form.forma_pago);
      fd.append('es_multisesion', form.es_multisesion);
      fd.append('sesiones_estimadas', form.es_multisesion ? form.sesiones_estimadas : 1);
      fd.append('estado', form.estado);
      fd.append('materiales', JSON.stringify(matSelec.map(m => ({ id: m.id, cantidad: m.cantidad }))));

      archivos.forEach(file => fd.append('radiografias', file));

      // Llamada al backend
      const token = localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:3000/api/tratamientos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'No se pudo crear el tratamiento');

      if (onCreated) onCreated(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el tratamiento');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="nt-overlay">
      <div className="nt-modal">

        {/* Header */}
        <div className="nt-header">
          <h3><i className="fas fa-tooth"></i> Nuevo Tratamiento</h3>
          <button type="button" className="nt-close" onClick={onClose}>×</button>
        </div>

        <form className="nt-form" onSubmit={handleSubmit}>

          {/* ── Sección 1: Diagnóstico y procedimiento ── */}
          <div>
            <p className="nt-section-title">Información clínica</p>
            <div className="nt-grid">
              <div className="nt-field nt-field-full">
                <label>Diagnóstico <span className="required">*</span></label>
                <input
                  name="diagnostico"
                  value={form.diagnostico}
                  onChange={handleChange}
                  placeholder="Ej. Caries profunda en diente 16"
                  required
                />
              </div>

              <div className="nt-field nt-field-full">
                <label>Procedimiento <span className="required">*</span></label>
                <input
                  name="procedimiento"
                  value={form.procedimiento}
                  onChange={handleChange}
                  placeholder="Ej. Obturación, endodoncia, extracción..."
                  required
                />
              </div>

              <div className="nt-field">
                <label>Estado del tratamiento</label>
                <select name="estado" value={form.estado} onChange={handleChange}>
                  <option value="planificado">Planificado</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="realizado">Realizado</option>
                </select>
              </div>

              <div className="nt-field">
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  placeholder="Notas adicionales sobre el tratamiento..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* ── Sección 2: Dientes ── */}
          <div>
            <p className="nt-section-title">Dientes afectados</p>
            <MiniOdonto selected={form.dientes} onToggle={toggleDiente} />
          </div>

          {/* ── Sección 3: Materiales ── */}
          <div>
            <p className="nt-section-title">Materiales utilizados</p>

            <div className="nt-mat-search">
              <input
                className="nt-field input"
                style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, flex: 1 }}
                placeholder="Buscar material..."
                value={queryMat}
                onChange={e => setQueryMat(e.target.value)}
              />
            </div>

            {queryMat && matFiltrados.length > 0 && (
              <div className="nt-mat-results">
                {matFiltrados.slice(0, 8).map(m => (
                  <div key={m.id} className="nt-mat-item" onClick={() => agregarMaterial(m)}>
                    <span>{m.nombre}</span>
                    <small>{m.stock ?? ''} {m.unidad || ''} disponibles</small>
                  </div>
                ))}
              </div>
            )}

            {matSelec.length > 0 && (
              <div className="nt-mat-selected">
                {matSelec.map(m => (
                  <div key={m.id} className="nt-mat-row">
                    <span>{m.nombre}</span>
                    <input
                      type="number"
                      min={1}
                      value={m.cantidad}
                      onChange={e => cambiarCantidad(m.id, e.target.value)}
                    />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{m.unidad}</span>
                    <button type="button" onClick={() => quitarMaterial(m.id)}>×</button>
                  </div>
                ))}
              </div>
            )}

            {matSelec.length === 0 && !queryMat && (
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                Busca y agrega materiales utilizados en este tratamiento.
              </p>
            )}
          </div>

          {/* ── Sección 4: Costo ── */}
          <div>
            <p className="nt-section-title">Costo y pago</p>
            <div className="nt-grid">
              <div className="nt-field">
                <label>Costo (L)</label>
                <input
                  type="number"
                  name="costo"
                  value={form.costo}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="nt-field">
                <label>Forma de pago</label>
                <select name="forma_pago" value={form.forma_pago} onChange={handleChange}>
                  {FORMAS_PAGO.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Sección 5: Multi-sesión ── */}
          <div>
            <p className="nt-section-title">Sesiones</p>
            <label className="nt-multisesion-check">
              <input
                type="checkbox"
                name="es_multisesion"
                checked={form.es_multisesion}
                onChange={handleChange}
              />
              Tratamiento multi-sesión
            </label>

            {form.es_multisesion && (
              <div className="nt-field" style={{ marginTop: 10, maxWidth: 200 }}>
                <label>Sesiones estimadas</label>
                <input
                  type="number"
                  name="sesiones_estimadas"
                  value={form.sesiones_estimadas}
                  onChange={handleChange}
                  min={2}
                  max={20}
                />
              </div>
            )}
          </div>

          {/* ── Sección 6: Radiografías ── */}
          <div>
            <p className="nt-section-title">Radiografías y documentos</p>

            <div
              className={`nt-dropzone ${dragOver ? 'over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputFileRef.current?.click()}
            >
              <i className="fas fa-cloud-upload-alt"></i>
              <p>Arrastra archivos aquí o haz clic para seleccionar</p>
              <small>PNG, JPG, PDF — máx. 10 MB por archivo</small>
            </div>

            <input
              ref={inputFileRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />

            {archivos.length > 0 && (
              <div className="nt-files-preview">
                {archivos.map((f, i) => (
                  <div key={i} className="nt-file-chip">
                    <i className="fas fa-file" style={{ fontSize: 11, color: '#2563eb' }}></i>
                    <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    <button type="button" onClick={() => quitarArchivo(i)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Error ── */}
          {error && <div className="nt-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

          {/* ── Acciones ── */}
          <div className="nt-actions">
            <button type="button" className="nt-btn nt-btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="nt-btn nt-btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar tratamiento'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}