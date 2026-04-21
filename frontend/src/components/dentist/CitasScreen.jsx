import './styles/dentista-global.css';

import React, { useState, useEffect } from 'react';
import { cancelarCita } from '../../services/citas.service';
import ReprogramarCitaModal from './ReprogramarCitaModal';
import CambiarConsultorioModal from './CambiarConsultorioModal';

const getToken = () => localStorage.getItem('token') || '';

const BRAND = {
  primary: '#4f46e5',
  secondary: '#db2777',
  border: '#c4b5fd',
  light: '#f0effe',
};

const ESTADO_COLORS = {
  confirmada:   { bg: '#dcfce7', color: '#166534', label: 'Confirmada' },
  pendiente:    { bg: '#e0f2fe', color: '#0369a1', label: 'Pendiente' },
  completada:   { bg: '#f3f4f6', color: '#374151', label: 'Completada' },
  cancelada:    { bg: '#fee2e2', color: '#dc2626', label: 'Cancelada' },
  programada:   { bg: '#dbeafe', color: '#1d4ed8', label: 'Programada' },
  reprogramada: { bg: '#fef9c3', color: '#854d0e', label: 'Reprogramada' },
};

const CitasScreen = ({ citas: citasProp, onCitaActualizada, onCitaCancelada, dentistaInfo }) => {
  const [citas,          setCitas]          = useState(Array.isArray(citasProp) ? citasProp : []);
  const [filtroEstado,   setFiltroEstado]   = useState('');
  const [filtroFecha,    setFiltroFecha]    = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [expandedId,     setExpandedId]     = useState(null);
  const [citaReprog,     setCitaReprog]     = useState(null);
  const [citaCambioC,    setCitaCambioC]    = useState(null);
  const [saving,         setSaving]         = useState(null);
  const [toast,          setToast]          = useState('');

  useEffect(() => {
    setCitas(Array.isArray(citasProp) ? citasProp : []);
  }, [citasProp]);

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const normEstado   = (e) => String(e || '').trim().toLowerCase();

  const citasFiltradas = citas.filter(c => {
    const est = normEstado(c.estado);
    return (
      (!filtroEstado    || est === filtroEstado) &&
      (!filtroPaciente  || (c.paciente_nombre || '').toLowerCase().includes(filtroPaciente.toLowerCase())) &&
      (!filtroFecha     || new Date(c.fecha_hora).toDateString() === new Date(filtroFecha).toDateString())
    );
  }).sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  const cambiarEstado = async (cita, nuevoEstado) => {
    try {
      setSaving(cita.id);
      const res = await fetch(`http://localhost:3000/api/citas/${cita.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error al actualizar');
      setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, estado: nuevoEstado } : c));
      if (onCitaActualizada) onCitaActualizada({ ...cita, estado: nuevoEstado });
      mostrarToast(`Cita marcada como "${nuevoEstado}"`);
    } catch (err) {
      mostrarToast(err.message || 'Error al actualizar');
    } finally {
      setSaving(null);
    }
  };

  const handleCancelar = async (cita) => {
    if (!window.confirm(`¿Cancelar la cita de ${cita.paciente_nombre}?`)) return;
    try {
      setSaving(cita.id);
      await cancelarCita(cita.id);
      setCitas(prev => prev.filter(c => c.id !== cita.id));
      if (onCitaCancelada) onCitaCancelada(cita);
      mostrarToast('Cita cancelada correctamente');
    } catch (err) {
      mostrarToast(err.message || 'Error al cancelar');
    } finally {
      setSaving(null);
    }
  };

  const handleReprogramarConfirm = (citaActualizada) => {
    setCitas(prev => prev.map(c => c.id === citaActualizada.id ? { ...c, ...citaActualizada } : c));
    if (onCitaActualizada) onCitaActualizada(citaActualizada);
    setCitaReprog(null);
    mostrarToast('Cita reprogramada correctamente');
  };

  const handleConsultorioUpdated = (citaActualizada) => {
    setCitas(prev => prev.map(c => c.id === citaActualizada.id ? { ...c, ...citaActualizada } : c));
    if (onCitaActualizada) onCitaActualizada(citaActualizada);
    setCitaCambioC(null);
    mostrarToast('Consultorio actualizado correctamente');
  };

  const formatFechaHora = (f) => new Date(f).toLocaleString('es-ES', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const formatDuracion = (min) => {
    if (!min) return '-';
    if (min < 60) return `${min} min`;
    return `${Math.floor(min / 60)}h ${min % 60 ? min % 60 + 'min' : ''}`;
  };

  // ── Datos de las tarjetas ──
  const estadisticas = [
    { label: 'Total',       value: citas.length,
      icon: 'fa-calendar-alt', bg: BRAND.light,    border: BRAND.border,  color: BRAND.primary },
    { label: 'Pendientes',  value: citas.filter(c => ['pendiente','programada','confirmada'].includes(normEstado(c.estado))).length,
      icon: 'fa-hourglass-half', bg: '#dcfce7', border: '#bbf7d0', color: '#166534' },
    { label: 'Confirmadas', value: citas.filter(c => normEstado(c.estado) === 'confirmada').length,
      icon: 'fa-check-circle',   bg: '#dbeafe', border: '#bfdbfe', color: '#1d4ed8' },
    { label: 'Completadas', value: citas.filter(c => normEstado(c.estado) === 'completada').length,
      icon: 'fa-check-double',   bg: '#f3f4f6', border: '#e5e7eb', color: '#374151' },
  ];

  const cardStyle = {
    background: 'white', borderRadius: 12, padding: '18px 16px',
    border: `1px solid ${BRAND.border}`, display: 'flex', flexDirection: 'column', gap: 10,
    boxShadow: '0 2px 8px rgba(79,70,229,0.06)', flex: 1,
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Tarjetas de estadísticas estilo tratamientos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {estadisticas.map((s, i) => (
          <div key={i} style={cardStyle}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${s.border}`,
            }}>
              <i className={`fas ${s.icon}`} style={{ fontSize: 14, color: s.color }}></i>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{
        background: 'white', borderRadius: 12, padding: '14px 20px',
        marginBottom: 16, boxShadow: '0 1px 4px rgba(79,70,229,0.06)',
        border: `1px solid ${BRAND.border}`,
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          placeholder="Buscar paciente..."
          value={filtroPaciente}
          onChange={e => setFiltroPaciente(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, flex: 1, minWidth: 150, outline: 'none' }} className="dentista-texto-pequeno"
        />
        <input
          type="date"
          value={filtroFecha}
          onChange={e => setFiltroFecha(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, outline: 'none' }} className="dentista-texto-pequeno"
        />
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, outline: 'none' }} className="dentista-texto-pequeno"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmada">Confirmada</option>
          <option value="programada">Programada</option>
          <option value="completada">Completada</option>
          <option value="reprogramada">Reprogramada</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <button
          onClick={() => { setFiltroPaciente(''); setFiltroFecha(''); setFiltroEstado(''); }}
          style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: BRAND.light, cursor: 'pointer', color: BRAND.primary, fontWeight: 600 }} className="dentista-texto-pequeno"
        >
          Limpiar
        </button>
      </div>

      {/* ── Lista de citas ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {citasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', background: 'white', borderRadius: 12, border: `1px solid ${BRAND.border}` }}>
            <i className="fas fa-calendar-times dentista-titulo" style={{ marginBottom: 12, display: 'block', opacity: 0.4 }}></i>
            <p style={{ margin: 0 }}>No hay citas que coincidan con los filtros</p>
          </div>
        ) : (
          citasFiltradas.map(cita => {
            const est      = normEstado(cita.estado);
            const estObj   = ESTADO_COLORS[est] || { bg: '#f3f4f6', color: '#374151', label: est };
            const isOpen   = expandedId === cita.id;
            const isSaving = saving === cita.id;
            const puedeConfirmar = ['pendiente', 'programada'].includes(est);
            const puedeCompletar = ['confirmada', 'pendiente', 'programada'].includes(est);
            const puedeReprogram = !['cancelada', 'completada'].includes(est);
            const puedeCancelar  = !['cancelada', 'completada'].includes(est);

            return (
              <div key={cita.id} style={{
                background: 'white', borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(79,70,229,0.07)', border: `1px solid ${BRAND.border}`,
              }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${estObj.color}, ${BRAND.secondary})`, opacity: 0.5 }} />
                <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

                  <div style={{ minWidth: 130 }}>
                    <div className="dentista-label" style={{ fontWeight: 800, color: '#111827' }}>
                      {formatFechaHora(cita.fecha_hora)}
                    </div>
                    <div className="dentista-texto-pequeno" style={{ color: '#6b7280', marginTop: 2 }}>
                      <i className="fas fa-clock" style={{ marginRight: 4, color: BRAND.primary, opacity: 0.6 }}></i>
                      {formatDuracion(cita.duracion_estimada)}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div className="dentista-label" style={{ fontWeight: 700, color: '#111827' }}>
                      {cita.paciente_nombre || 'Paciente'}
                    </div>
                    <div className="dentista-texto-pequeno" style={{ color: '#6b7280', marginTop: 2 }}>
                      {cita.motivo || 'Consulta general'}
                    </div>
                  </div>

                  {cita.id_consultorio && (
                    <div className="dentista-texto-pequeno" style={{ color: '#6b7280', minWidth: 80 }}>
                      <i className="fas fa-door-open" style={{ marginRight: 4, color: BRAND.primary, opacity: 0.6 }}></i>
                      Consul. {cita.id_consultorio}
                    </div>
                  )}

                  <span className="dentista-label" style={{
                    background: estObj.bg, color: estObj.color,
                    padding: '4px 12px', borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap',
                    border: `1px solid ${estObj.bg}`,
                  }}>
                    {estObj.label}
                  </span>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {puedeConfirmar && (
                      <button onClick={() => cambiarEstado(cita, 'confirmada')} disabled={isSaving}
                        style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#166534', fontWeight: 700, cursor: 'pointer' }} className="dentista-label">
                        <i className="fas fa-check" style={{ marginRight: 4 }}></i>Confirmar
                      </button>
                    )}
                    {puedeCompletar && (
                      <button onClick={() => cambiarEstado(cita, 'completada')} disabled={isSaving}
                        style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#f3f4f6', color: '#374151', fontWeight: 700, cursor: 'pointer' }} className="dentista-label">
                        <i className="fas fa-check-double" style={{ marginRight: 4 }}></i>Completada
                      </button>
                    )}
                    {puedeReprogram && (
                      <button onClick={() => setCitaReprog(cita)} disabled={isSaving}
                        style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#fef9c3', color: '#854d0e', fontWeight: 700, cursor: 'pointer' }} className="dentista-label">
                        <i className="fas fa-calendar-alt" style={{ marginRight: 4 }}></i>Reprogramar
                      </button>
                    )}
                    <button onClick={() => setCitaCambioC(cita)} disabled={isSaving}
                      style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: BRAND.light, color: BRAND.primary, fontWeight: 700, cursor: 'pointer' }} className="dentista-label">
                      <i className="fas fa-door-open" style={{ marginRight: 4 }}></i>Consultorio
                    </button>
                    {puedeCancelar && (
                      <button onClick={() => handleCancelar(cita)} disabled={isSaving}
                        style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }} className="dentista-label">
                        <i className="fas fa-times" style={{ marginRight: 4 }}></i>
                        {isSaving ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    )}
                    <button onClick={() => setExpandedId(isOpen ? null : cita.id)}
                      style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: isOpen ? BRAND.light : 'white', color: BRAND.primary, cursor: 'pointer' }} className="dentista-texto-pequeno">
                      <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{
                    borderTop: `1px solid ${BRAND.border}`, padding: '14px 20px',
                    background: BRAND.light + '44',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12,
                  }}>
                    {[
                      { label: 'ID Cita',     value: cita.id },
                      { label: 'Paciente',    value: cita.paciente_nombre || '-' },
                      { label: 'Motivo',      value: cita.motivo || 'Consulta general' },
                      { label: 'Duración',    value: formatDuracion(cita.duracion_estimada) },
                      { label: 'Consultorio', value: cita.id_consultorio || 'No asignado' },
                      { label: 'Estado',      value: estObj.label },
                      { label: 'Fecha',       value: new Date(cita.fecha_hora).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) },
                      { label: 'Hora',        value: new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) },
                    ].map(f => (
                      <div key={f.label} style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: `1px solid ${BRAND.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: BRAND.primary, textTransform: 'uppercase', marginBottom: 3, opacity: 0.8 }}>{f.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {citaReprog && (
        <ReprogramarCitaModal
          cita={citaReprog}
          nuevaFecha={new Date(citaReprog.fecha_hora).toISOString().split('T')[0]}
          nuevaHora={new Date(citaReprog.fecha_hora).toTimeString().slice(0, 5)}
          onConfirm={handleReprogramarConfirm}
          onCancel={() => setCitaReprog(null)}
        />
      )}

      {citaCambioC && (
        <CambiarConsultorioModal
          open={!!citaCambioC}
          cita={citaCambioC}
          onClose={() => setCitaCambioC(null)}
          onUpdated={handleConsultorioUpdated}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
          background: BRAND.gradient, color: 'white', padding: '12px 20px',
          borderRadius: 12, fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(79,70,229,0.3)',
        }}>
          <i className="fas fa-check-circle" style={{ marginRight: 8 }}></i>{toast}
        </div>
      )}
    </div>
  );
};

export default CitasScreen;