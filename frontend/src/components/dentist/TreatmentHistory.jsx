import './styles/dentista-global.css';
import React, { useState, useEffect } from "react";
import NuevoTratamientoModal from './NuevoTratamientoModal';
import VisualizadorDocumentos from './VisualizadorDocumentos';
import './MisPacientesScreen.css';

const getToken = () => localStorage.getItem('token') || '';

const BRAND = {
  gradient: 'linear-gradient(135deg, #4f46e5, #db2777)',
  primary: '#4f46e5',
  secondary: '#db2777',
  light: '#f0effe',
  lightPink: '#fdf2f8',
  border: '#c4b5fd',
};

const ESTADO_STYLE = {
  realizado:   { bg:'#dcfce7', color:'#166534', label:'Realizado',   icon:'fa-check-circle',  border:'#bbf7d0' },
  en_proceso:  { bg:'#fef9c3', color:'#854d0e', label:'En proceso',  icon:'fa-spinner',        border:'#fde68a' },
  planificado: { bg:'#eff6ff', color:'#1d4ed8', label:'Planificado', icon:'fa-clock',          border:'#bfdbfe' },
  cancelado:   { bg:'#fef2f2', color:'#dc2626', label:'Cancelado',   icon:'fa-times-circle',   border:'#fecaca' },
};

const ESTADOS_TRANSICION = [
  { value: 'planificado', label: 'Planificado' },
  { value: 'en_proceso',  label: 'En proceso'  },
  { value: 'realizado',   label: 'Realizado'   },
];

// ── Modal Editar Estado ───────────────────────────────────────────────────────
const EditarEstadoModal = ({ tratamiento, onClose, onGuardado }) => {
  const [nuevoEstado, setNuevoEstado] = useState(tratamiento?.estado || 'planificado');
  const [nota,        setNota]        = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const handleGuardar = async () => {
    setError('');
    try {
      setSaving(true);
      const res = await fetch(`http://localhost:3000/api/tratamientos/${tratamiento.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, observaciones: nota || undefined }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar el estado');
      onGuardado();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, backdropFilter:'blur(4px)', padding:16 }}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'0 24px 48px rgba(0,0,0,0.2)', overflow:'hidden' }}>
        <div style={{ background:BRAND.gradient, padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0, color:'white', fontSize:16, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-pen"></i> Editar estado
          </h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, color:'white', width:32, height:32, cursor:'pointer', fontSize:16 }}>×</button>
        </div>
        <div style={{ padding:24, display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:8 }}>Tratamiento</div>
            <div style={{ background:BRAND.light, borderRadius:10, padding:'10px 14px', fontSize:14, fontWeight:600, color:'#111827' }}>
              {tratamiento?.tipo || tratamiento?.procedimiento || 'Tratamiento'}
            </div>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:8 }}>Nuevo estado</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {ESTADOS_TRANSICION.map(e => {
                const est = ESTADO_STYLE[e.value];
                const activo = nuevoEstado === e.value;
                return (
                  <button key={e.value} type="button" onClick={() => setNuevoEstado(e.value)}
                    style={{ padding:'10px 14px', borderRadius:10, border:`2px solid ${activo ? est.color : est.border}`, background: activo ? est.bg : 'white', color: est.color, fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'all 0.15s' }}>
                    <i className={`fas ${est.icon}`}></i>
                    {e.label}
                    {activo && <i className="fas fa-check" style={{ marginLeft:'auto', fontSize:11 }}></i>}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:8 }}>Nota de evolución <span style={{ fontWeight:400, color:'#9ca3af' }}>(opcional)</span></div>
            <textarea value={nota} onChange={e => setNota(e.target.value)}
              placeholder="Ej. Paciente responde bien al tratamiento..."
              rows={3} style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:10, fontSize:14, resize:'vertical', boxSizing:'border-box', outline:'none' }} />
          </div>
          {error && <div style={{ background:'#fef2f2', color:'#dc2626', padding:'10px 14px', borderRadius:10, fontSize:13, fontWeight:600 }}>{error}</div>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose}
              style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'#f1f5f9', color:'#374151', fontWeight:700, cursor:'pointer', fontSize:14 }}>
              Cancelar
            </button>
            <button type="button" onClick={handleGuardar} disabled={saving}
              style={{ padding:'10px 20px', borderRadius:10, border:'none', background:BRAND.gradient, color:'white', fontWeight:800, cursor:'pointer', fontSize:14, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Modal Cancelar con motivo ─────────────────────────────────────────────────
const CancelarModal = ({ tratamiento, onClose, onCancelado }) => {
  const [motivo,  setMotivo]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const handleCancelar = async () => {
    if (!motivo.trim()) { setError('El motivo de cancelación es obligatorio.'); return; }
    setError('');
    try {
      setSaving(true);
      const res = await fetch(`http://localhost:3000/api/tratamientos/${tratamiento.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cancelado', motivo_cancelacion: motivo.trim() }),
      });
      if (!res.ok) throw new Error('No se pudo cancelar el tratamiento');
      onCancelado();
    } catch (err) {
      setError(err.message || 'Error al cancelar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, backdropFilter:'blur(4px)', padding:16 }}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'0 24px 48px rgba(0,0,0,0.2)', overflow:'hidden' }}>
        <div style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0, color:'white', fontSize:16, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-times-circle"></i> Cancelar tratamiento
          </h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, color:'white', width:32, height:32, cursor:'pointer', fontSize:16 }}>×</button>
        </div>
        <div style={{ padding:24, display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#fef2f2', borderRadius:10, padding:'12px 14px', border:'1px solid #fecaca' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#dc2626', marginBottom:4 }}>Tratamiento a cancelar</div>
            <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{tratamiento?.tipo || tratamiento?.procedimiento || 'Tratamiento'}</div>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:8 }}>
              Motivo de cancelación <span style={{ color:'#dc2626' }}>*</span>
            </div>
            <textarea value={motivo} onChange={e => { setMotivo(e.target.value); setError(''); }}
              placeholder="Ej. Paciente no continuó con el tratamiento, contraindicación médica..."
              rows={4} style={{ width:'100%', padding:'10px 12px', border:`1px solid ${error ? '#dc2626' : '#d1d5db'}`, borderRadius:10, fontSize:14, resize:'vertical', boxSizing:'border-box', outline:'none' }} />
          </div>
          {error && <div style={{ background:'#fef2f2', color:'#dc2626', padding:'10px 14px', borderRadius:10, fontSize:13, fontWeight:600 }}>{error}</div>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose}
              style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'#f1f5f9', color:'#374151', fontWeight:700, cursor:'pointer', fontSize:14 }}>
              Volver
            </button>
            <button type="button" onClick={handleCancelar} disabled={saving}
              style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', fontWeight:800, cursor:'pointer', fontSize:14, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Exportar PDF ──────────────────────────────────────────────────────────────
const exportarHistorialPDF = (pacienteNombre, pacienteId, tratamientos) => {
  const fecha = new Date().toLocaleDateString('es-HN', { day:'2-digit', month:'long', year:'numeric' });
  const filas = tratamientos.map((t, i) => {
    const est = ESTADO_STYLE[t.estado] || ESTADO_STYLE['planificado'];
    const diente = t.diente || (() => { try { return JSON.parse(t.dientes||'[]').join(', ') || '-'; } catch { return '-'; } })();
    return `
      <tr style="background:${i%2===0?'#f8fafc':'white'}">
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${t.fecha ? new Date(t.fecha).toLocaleDateString('es-HN') : '-'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;">${t.tipo||t.procedimiento||'-'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${t.diagnostico||'-'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;">${diente}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
          <span style="background:${est.bg};color:${est.color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">${est.label}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;">${t.costo ? `L. ${parseFloat(t.costo).toFixed(2)}` : '-'}</td>
      </tr>
      ${t.observaciones ? `<tr style="background:${i%2===0?'#f8fafc':'white'}"><td colspan="6" style="padding:4px 12px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;"><em>${t.observaciones}</em></td></tr>` : ''}
    `;
  }).join('');
  const costoTotal = tratamientos.reduce((s,t) => s + (parseFloat(t.costo)||0), 0);
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Historial — ${pacienteNombre}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a2c3e;background:white;padding:32px;font-size:14px;}.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;margin-bottom:24px;position:relative;}.header::after{content:'';display:block;position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(135deg,#4f46e5,#db2777);border-radius:2px;}.clinic-name{font-size:24px;font-weight:900;background:linear-gradient(135deg,#4f46e5,#db2777);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}.patient-card{background:linear-gradient(135deg,#f0effe,#fdf2f8);border-radius:14px;padding:16px 22px;margin-bottom:22px;border-left:5px solid #4f46e5;display:flex;justify-content:space-between;align-items:center;}.patient-name{font-size:20px;font-weight:900;color:#1e1b4b;}table{width:100%;border-collapse:collapse;margin-top:8px;}th{background:linear-gradient(135deg,#4f46e5,#db2777);color:white;padding:10px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;text-align:left;}th:last-child{text-align:right;}.total-row td{padding:12px;font-weight:800;font-size:14px;color:#4f46e5;border-top:2px solid #4f46e5;}.footer{margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;}@media print{body{padding:20px;}@page{margin:1.5cm;}}</style></head>
  <body><div class="header"><div><div class="clinic-name">DentMed</div><div style="font-size:12px;color:#6b7280;margin-top:2px;">Sistema de Gestión Clínica</div></div><div style="text-align:right;"><div style="font-size:18px;font-weight:800;color:#111827;">Historial de Tratamientos</div><div style="font-size:11px;color:#6b7280;margin-top:3px;">Generado el ${fecha}</div></div></div>
  <div class="patient-card"><div><div class="patient-name">${pacienteNombre}</div><div style="font-size:12px;color:#6b7280;margin-top:4px;">ID: ${pacienteId||'-'} · ${tratamientos.length} tratamiento${tratamientos.length!==1?'s':''}</div></div><div style="text-align:right;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Costo total</div><div style="font-size:22px;font-weight:900;color:#4f46e5;">L. ${costoTotal.toFixed(2)}</div></div></div>
  <table><thead><tr><th>Fecha</th><th>Procedimiento</th><th>Diagnóstico</th><th>Diente(s)</th><th>Estado</th><th style="text-align:right;">Costo</th></tr></thead><tbody>${filas||'<tr><td colspan="6" style="padding:20px;text-align:center;color:#9ca3af;">Sin tratamientos</td></tr>'}<tr class="total-row"><td colspan="5">Total acumulado</td><td style="text-align:right;">L. ${costoTotal.toFixed(2)}</td></tr></tbody></table>
  <div style="margin-top:40px;display:flex;justify-content:flex-end;"><div style="text-align:center;width:240px;"><div style="height:40px;"></div><div style="border-top:1px solid #374151;padding-top:8px;font-size:11px;color:#374151;">Dr./Dra. ____________________________<br/>Firma y sello</div></div></div>
  <div class="footer"><span style="font-weight:700;">DentMed</span><span>Generado el ${fecha} · Documento confidencial</span></div>
  <script>window.onload=()=>{window.print();}</script></body></html>`;
  const ventana = window.open('','_blank','width=960,height=720');
  if (ventana) { ventana.document.write(html); ventana.document.close(); }
};

// ── Card de tratamiento ───────────────────────────────────────────────────────
const TratamientoCard = ({ t, pacienteVisible, onActualizar, dentistaInfo }) => {
  const [expandido,    setExpandido]    = useState(false);
  const [showEditar,   setShowEditar]   = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);

  const est          = ESTADO_STYLE[t.estado] || ESTADO_STYLE['planificado'];
  const cancelado    = t.estado === 'cancelado';
  const esMultisesion = t.es_multisesion || (t.sesiones_totales > 1);
  const sesComp      = t.sesiones_completadas || 0;
  const sesTot       = t.sesiones_totales || t.sesiones_estimadas || 1;
  const progreso     = esMultisesion ? Math.round((sesComp / sesTot) * 100) : 0;

  const parseDientes = () => {
    if (t.diente) return t.diente;
    try { return JSON.parse(t.dientes || '[]').join(', ') || '-'; } catch { return '-'; }
  };

  return (
    <>
      <div style={{
        background: cancelado ? '#fafafa' : 'white',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: cancelado ? 'none' : '0 2px 12px rgba(79,70,229,0.07)',
        border: `1px solid ${cancelado ? '#e5e7eb' : est.border}`,
        marginBottom: 10, opacity: cancelado ? 0.7 : 1, transition: 'box-shadow 0.15s',
      }}>
        <div style={{ height: 3, background: cancelado ? '#e5e7eb' : `linear-gradient(90deg, ${est.color}, ${BRAND.secondary})`, opacity: 0.7 }} />
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: est.bg, border: `1px solid ${est.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`fas ${est.icon}`} style={{ color: est.color, fontSize: 17 }}></i>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: cancelado ? '#6b7280' : '#111827', textDecoration: cancelado ? 'line-through' : 'none' }}>
                {t.tipo || t.procedimiento || 'Tratamiento'}
              </span>
              <span style={{ background: est.bg, color: est.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${est.border}` }}>
                {est.label}
              </span>
              {esMultisesion && (
                <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, border: '1px solid #e9d5ff' }}>Multi-sesión</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span><i className="fas fa-calendar" style={{ marginRight: 4, color: BRAND.primary, opacity: 0.6 }}></i>{t.fecha ? new Date(t.fecha).toLocaleDateString('es-HN') : '-'}</span>
              {pacienteVisible && <span><i className="fas fa-user" style={{ marginRight: 4, color: BRAND.primary, opacity: 0.6 }}></i>{t.Paciente?.nombre || t.paciente_nombre || '-'}</span>}
              <span><i className="fas fa-tooth" style={{ marginRight: 4, color: BRAND.primary, opacity: 0.6 }}></i>{parseDientes()}</span>
              {t.costo > 0 && <span><i className="fas fa-dollar-sign" style={{ marginRight: 4, color: '#0f6e56', opacity: 0.8 }}></i>L. {parseFloat(t.costo).toFixed(2)}</span>}
            </div>
            {esMultisesion && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginBottom: 3 }}>
                  <span>Progreso</span>
                  <span style={{ fontWeight: 700, color: BRAND.primary }}>{sesComp} de {sesTot} sesiones</span>
                </div>
                <div style={{ background: '#e5e7eb', borderRadius: 20, height: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${progreso}%`, height: '100%', background: BRAND.gradient, borderRadius: 20, transition: 'width 0.4s' }} />
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setExpandido(e => !e)}
              style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: expandido ? BRAND.light : 'white', color: BRAND.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className={`fas fa-chevron-${expandido ? 'up' : 'down'}`} style={{ fontSize: 10 }}></i>
              {expandido ? 'Ocultar' : 'Detalles'}
            </button>
            {!cancelado && (
              <>
                <button onClick={() => setShowEditar(true)}
                  style={{ padding: '6px 12px', borderRadius: 8, background: BRAND.light, color: BRAND.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${BRAND.border}` }}>
                  <i className="fas fa-pen" style={{ marginRight: 4 }}></i>Editar
                </button>
                <button onClick={() => setShowCancelar(true)}
                  style={{ padding: '6px 12px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid #fecaca' }}>
                  <i className="fas fa-times" style={{ marginRight: 4 }}></i>Cancelar
                </button>
              </>
            )}
          </div>
        </div>
        {expandido && (
          <div style={{ borderTop: `1px solid ${est.border}`, padding: '14px 18px', background: cancelado ? '#f9fafb' : BRAND.light + '44' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 10 }}>
              {[
                { label: 'Diagnóstico',   value: t.diagnostico || '-' },
                { label: 'Procedimiento', value: t.procedimiento || t.tipo || '-' },
                { label: 'Doctor',        value: t.Dentista ? `${t.Dentista.nombre} ${t.Dentista.apellidos||''}`.trim() : (dentistaInfo?.nombre || '-') },
                { label: 'Forma de pago', value: t.forma_pago || '-' },
                ...(t.motivo_cancelacion ? [{ label: 'Motivo cancelación', value: t.motivo_cancelacion, full: true }] : []),
                ...(t.observaciones      ? [{ label: 'Observaciones',       value: t.observaciones,       full: true }] : []),
              ].map((f, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: `1px solid ${est.border}`, gridColumn: f.full ? '1/-1' : undefined }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: BRAND.primary, textTransform: 'uppercase', marginBottom: 3, opacity: 0.8 }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showEditar && (
        <EditarEstadoModal tratamiento={t} onClose={() => setShowEditar(false)} onGuardado={() => { setShowEditar(false); onActualizar(); }} />
      )}
      {showCancelar && (
        <CancelarModal tratamiento={t} onClose={() => setShowCancelar(false)} onCancelado={() => { setShowCancelar(false); onActualizar(); }} />
      )}
    </>
  );
};

const TreatmentHistory = ({ pacienteId: pacienteIdProp, pacienteNombre: pacienteNombreProp, dentistaInfo }) => {
  const [todosLosTratamientos, setTodosLosTratamientos] = useState([]);
  const [loadingTodos,         setLoadingTodos]         = useState(false);
  const [tratamientosPaciente, setTratamientosPaciente] = useState([]);
  const [loadingPaciente,      setLoadingPaciente]      = useState(false);
  const [pacienteId,           setPacienteId]           = useState(pacienteIdProp || null);
  const [pacienteNombre,       setPacienteNombre]       = useState(pacienteNombreProp || '');
  const [tratKey,              setTratKey]              = useState(0);
  const [modalRx,              setModalRx]              = useState(null);
  const [showNuevoTrat,        setShowNuevoTrat]        = useState(false);
  const [exportMsg,            setExportMsg]            = useState('');
  const [toast,                setToast]                = useState('');
  const [filtroTipo,           setFiltroTipo]           = useState('');
  const [filtroDesde,          setFiltroDesde]          = useState('');
  const [filtroHasta,          setFiltroHasta]          = useState('');
  const [filtroPaciente,       setFiltroPaciente]       = useState('');
  const [filtroEstado,         setFiltroEstado]         = useState('');

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (pacienteIdProp) { setPacienteId(pacienteIdProp); setPacienteNombre(pacienteNombreProp || ''); }
  }, [pacienteIdProp, pacienteNombreProp]);

  useEffect(() => {
    setLoadingTodos(true);
    fetch('http://localhost:3000/api/tratamientos', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => setTodosLosTratamientos(d.tratamientos || []))
      .catch(() => setTodosLosTratamientos([]))
      .finally(() => setLoadingTodos(false));
  }, [tratKey]);

  useEffect(() => {
    if (!pacienteId) { setTratamientosPaciente([]); return; }
    setLoadingPaciente(true);
    fetch(`http://localhost:3000/api/pacientes/${pacienteId}/tratamientos`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => setTratamientosPaciente(d.tratamientos || []))
      .catch(() => setTratamientosPaciente([]))
      .finally(() => setLoadingPaciente(false));
  }, [pacienteId, tratKey]);

  const listaActiva = pacienteId ? tratamientosPaciente : todosLosTratamientos;
  const loading     = pacienteId ? loadingPaciente : loadingTodos;

  const hoy = new Date().toDateString();
  const tratamientosHoy = listaActiva.filter(t => new Date(t.fecha).toDateString() === hoy);
  const realizadosHoy   = tratamientosHoy.filter(t => t.estado === 'realizado').length;
  const planificadosHoy = tratamientosHoy.filter(t => t.estado === 'planificado').length;
  const costoTotal      = listaActiva.reduce((sum, t) => sum + (parseFloat(t.costo) || 0), 0);
  const tiposUnicos     = Array.from(new Set(listaActiva.map(t => t.tipo).filter(Boolean)));
  const hayFiltros      = filtroTipo || filtroDesde || filtroHasta || filtroPaciente || filtroEstado;

  const tratamientosFiltrados = listaActiva.filter(t => {
    const pac = t.Paciente?.nombre || t.paciente_nombre || '';
    return (
      (!filtroTipo     || t.tipo === filtroTipo) &&
      (!filtroDesde    || new Date(t.fecha) >= new Date(filtroDesde)) &&
      (!filtroHasta    || new Date(t.fecha) <= new Date(filtroHasta)) &&
      (!filtroPaciente || pac.toLowerCase().includes(filtroPaciente.toLowerCase())) &&
      (!filtroEstado   || t.estado === filtroEstado)
    );
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const handleExportPDF = () => {
    if (!pacienteId) {
      setExportMsg('Selecciona un paciente para exportar.');
      setTimeout(() => setExportMsg(''), 2500);
      return;
    }
    exportarHistorialPDF(pacienteNombre || 'Paciente', pacienteId, listaActiva);
  };

  const cardStyle = {
    background: 'white', borderRadius: 12, padding: '18px 16px',
    border: `1px solid ${BRAND.border}`, display: 'flex', flexDirection: 'column', gap: 10,
    boxShadow: `0 2px 8px rgba(79,70,229,0.06)`,
  };
  const iconStyle = (bg) => ({ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' });

  return (
    <div className="dm20-page">
      <div className="dm20-card" style={{ marginBottom: 20 }}>
        <div className="dm20-header">
          <div>
            <h2 className="dentista-titulo" style={{ margin: 0, fontWeight: 900, color: '#173067' }}>
              <i className="fas fa-tooth" style={{ marginRight: 10, color: BRAND.primary }}></i>
              Tratamientos
            </h2>
            <p className="dentista-texto-pequeno" style={{ margin: '4px 0 0', color: '#6b7280' }}>
              {pacienteNombre ? <>Paciente: <strong style={{ color: BRAND.primary }}>{pacienteNombre}</strong></> : 'Resumen clínico del día'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setShowNuevoTrat(true)}
              style={{ padding: '10px 18px', borderRadius: 12, background: BRAND.gradient, color: '#fff', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 16px rgba(79,70,229,0.25)' }}>
              <i className="fas fa-plus"></i> Nuevo tratamiento
            </button>
            <button onClick={handleExportPDF}
              style={{ padding: '10px 18px', borderRadius: 12, background: 'white', color: BRAND.primary, border: `1.5px solid ${BRAND.border}`, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-file-pdf"></i> Exportar PDF
            </button>
          </div>
        </div>
        {exportMsg && <div style={{ margin: '8px 0 0', color: BRAND.primary, fontWeight: 700, fontSize: 13 }}>{exportMsg}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={iconStyle('#eff6ff')}><i className="fas fa-calendar-day" style={{ fontSize: 14, color: BRAND.primary }}></i></div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: BRAND.primary, lineHeight: 1 }}>{tratamientosHoy.length}</div>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Hoy</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconStyle('#dcfce7')}><i className="fas fa-check-circle" style={{ fontSize: 14, color: '#166534' }}></i></div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#166534', lineHeight: 1 }}>{realizadosHoy}</div>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Realizados</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconStyle('#fef9c3')}><i className="fas fa-clock" style={{ fontSize: 14, color: '#854d0e' }}></i></div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#854d0e', lineHeight: 1 }}>{planificadosHoy}</div>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Planificados</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconStyle(BRAND.light)}><i className="fas fa-dollar-sign" style={{ fontSize: 14, color: BRAND.secondary }}></i></div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.secondary, lineHeight: 1 }}>L. {costoTotal.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Costo total</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: '14px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(79,70,229,0.06)', border: `1px solid ${BRAND.border}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {!pacienteId && (
          <input placeholder="Filtrar por paciente..." value={filtroPaciente} onChange={e => setFiltroPaciente(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, fontSize: 13, flex: 1, minWidth: 150, outline: 'none' }} />
        )}
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, fontSize: 13, outline: 'none' }}>
          <option value="">Tipo</option>
          {tiposUnicos.map((t, i) => <option key={i} value={t}>{t}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, fontSize: 13, outline: 'none' }}>
          <option value="">Estado</option>
          <option value="planificado">Planificado</option>
          <option value="en_proceso">En proceso</option>
          <option value="realizado">Realizado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, fontSize: 13, outline: 'none' }} />
        <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, fontSize: 13, outline: 'none' }} />
        <button onClick={() => { setFiltroTipo(''); setFiltroDesde(''); setFiltroHasta(''); setFiltroPaciente(''); setFiltroEstado(''); }}
          style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: BRAND.light, fontSize: 13, cursor: 'pointer', color: BRAND.primary, fontWeight: 600 }}>
          Limpiar
        </button>
        {pacienteId && !pacienteIdProp && (
          <button onClick={() => { setPacienteId(null); setPacienteNombre(''); }}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', fontSize: 13, cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>
            <i className="fas fa-times" style={{ marginRight: 4 }}></i>Ver todos
          </button>
        )}
      </div>

      <div className="dm20-card">
        <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${BRAND.light}` }}>
          <h3 className="dentista-titulo" style={{ margin: 0, fontWeight: 800, color: '#173067' }}>
            {pacienteId ? `Tratamientos de ${pacienteNombre}` : 'Todos los tratamientos'}
          </h3>
          <span style={{ fontSize: 12, color: BRAND.primary, fontWeight: 600, background: BRAND.light, padding: '4px 10px', borderRadius: 20 }}>
            {tratamientosFiltrados.length} resultado{tratamientosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ padding: '12px 16px 16px' }}>
          {loading ? (
            <div className="dm20-empty" style={{ color: BRAND.primary }}>Cargando tratamientos...</div>
          ) : listaActiva.length === 0 && !hayFiltros ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: BRAND.light, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: `2px dashed ${BRAND.border}` }}>
                <i className="fas fa-tooth" style={{ fontSize: 28, color: BRAND.primary, opacity: 0.6 }}></i>
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#374151' }}>
                {pacienteId ? 'Sin tratamientos registrados' : 'No hay tratamientos hoy'}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
                {pacienteId ? 'Este paciente aún no tiene tratamientos en el sistema.' : 'Registra el primer tratamiento del día.'}
              </p>
            </div>
          ) : tratamientosFiltrados.length === 0 && hayFiltros ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9ca3af' }}>
              <i className="fas fa-filter" style={{ fontSize: 28, marginBottom: 10, display: 'block', opacity: 0.4 }}></i>
              <p style={{ margin: 0, fontSize: 13 }}>No hay tratamientos que coincidan con los filtros.</p>
            </div>
          ) : (
            tratamientosFiltrados.map(t => (
              <TratamientoCard key={t.id} t={t} pacienteVisible={!pacienteId}
                onActualizar={() => setTratKey(k => k + 1)} dentistaInfo={dentistaInfo} />
            ))
          )}
        </div>
      </div>

      <NuevoTratamientoModal
        open={showNuevoTrat}
        onClose={() => setShowNuevoTrat(false)}
        onCreated={() => { setShowNuevoTrat(false); setTratKey(k => k + 1); mostrarToast('Tratamiento registrado correctamente'); }}
        pacienteId={pacienteId}
        pacienteNombre={pacienteNombre}
        onPacienteSeleccionado={(id, nombre) => { setPacienteId(id); setPacienteNombre(nombre); setTratKey(k => k + 1); }}
      />

      {modalRx && (
        <VisualizadorDocumentos open={!!modalRx} documentos={[modalRx]} initialIndex={0} onClose={() => setModalRx(null)} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300, background: BRAND.gradient, color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(79,70,229,0.3)' }}>
          <i className="fas fa-check-circle" style={{ marginRight: 8 }}></i>{toast}
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;