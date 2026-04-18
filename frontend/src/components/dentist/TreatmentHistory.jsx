import React, { useState, useEffect } from "react";
import NuevoTratamientoModal from './NuevoTratamientoModal';
import VisualizadorDocumentos from './VisualizadorDocumentos';
import './MisPacientesScreen.css';

const getToken = () => localStorage.getItem('token') || '';

const BRAND = {
  gradient: 'linear-gradient(135deg, #4f46e5, #db2777)',
  primary: '#4f46e5',
  secondary: '#db2777',
};

const ESTADO_STYLE = {
  realizado:   { bg:'#dcfce7', color:'#166534', label:'Realizado',   icon:'fa-check-circle' },
  en_proceso:  { bg:'#fef9c3', color:'#854d0e', label:'En proceso',  icon:'fa-spinner' },
  planificado: { bg:'#eff6ff', color:'#1d4ed8', label:'Planificado', icon:'fa-clock' },
};

// ── Exportar PDF de historial de tratamientos en frontend ─────────────────────
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

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Historial de Tratamientos — ${pacienteNombre}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; color:#1a2c3e; background:white; padding:32px; font-size:14px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:18px; margin-bottom:24px; position:relative; }
    .header::after { content:''; display:block; position:absolute; bottom:0; left:0; right:0; height:3px; background:linear-gradient(135deg,#4f46e5,#db2777); border-radius:2px; }
    .clinic-name { font-size:24px; font-weight:900; background:linear-gradient(135deg,#4f46e5,#db2777); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .patient-card { background:linear-gradient(135deg,#f0effe,#fdf2f8); border-radius:14px; padding:16px 22px; margin-bottom:22px; border-left:5px solid #4f46e5; display:flex; justify-content:space-between; align-items:center; }
    .patient-name { font-size:20px; font-weight:900; color:#1e1b4b; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    th { background:linear-gradient(135deg,#4f46e5,#db2777); color:white; padding:10px 12px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; text-align:left; }
    th:last-child { text-align:right; }
    .total-row td { padding:12px; font-weight:800; font-size:14px; color:#4f46e5; border-top:2px solid #4f46e5; }
    .footer { margin-top:32px; padding-top:14px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:10px; color:#9ca3af; }
    @media print { body{padding:20px;} @page{margin:1.5cm;} }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic-name">DentMed</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px;">Sistema de Gestión Clínica</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:18px;font-weight:800;color:#111827;">Historial de Tratamientos</div>
      <div style="font-size:11px;color:#6b7280;margin-top:3px;">Generado el ${fecha}</div>
    </div>
  </div>

  <div class="patient-card">
    <div>
      <div class="patient-name">${pacienteNombre}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px;">ID Paciente: ${pacienteId || '-'} &nbsp;·&nbsp; ${tratamientos.length} tratamiento${tratamientos.length!==1?'s':''} registrado${tratamientos.length!==1?'s':''}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Costo total acumulado</div>
      <div style="font-size:22px;font-weight:900;color:#4f46e5;">L. ${costoTotal.toFixed(2)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Procedimiento</th>
        <th>Diagnóstico</th>
        <th>Diente(s)</th>
        <th>Estado</th>
        <th style="text-align:right;">Costo</th>
      </tr>
    </thead>
    <tbody>
      ${filas || '<tr><td colspan="6" style="padding:20px;text-align:center;color:#9ca3af;">Sin tratamientos registrados</td></tr>'}
      <tr class="total-row">
        <td colspan="5">Total acumulado</td>
        <td style="text-align:right;">L. ${costoTotal.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top:40px;display:flex;justify-content:flex-end;">
    <div style="text-align:center;width:240px;">
      <div style="height:40px;"></div>
      <div style="border-top:1px solid #374151;padding-top:8px;font-size:11px;color:#374151;">Dr./Dra. ____________________________<br/>Firma y sello del profesional</div>
    </div>
  </div>

  <div class="footer">
    <span style="font-weight:700;background:linear-gradient(135deg,#4f46e5,#db2777);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">DentMed</span>
    <span>Historial generado el ${fecha} · Documento confidencial</span>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const ventana = window.open('', '_blank', 'width=960,height=720');
  if (ventana) { ventana.document.write(html); ventana.document.close(); }
};

// ── Card de tratamiento individual ────────────────────────────────────────────
const TratamientoCard = ({ t, pacienteVisible, onCancelar, onEditar, dentistaInfo }) => {
  const [expandido, setExpandido] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const est = ESTADO_STYLE[t.estado] || ESTADO_STYLE['planificado'];
  const esMultisesion = t.es_multisesion || (t.sesiones_totales > 1);
  const sesComp = t.sesiones_completadas || 0;
  const sesTot  = t.sesiones_totales || t.sesiones_estimadas || 1;
  const progreso = esMultisesion ? Math.round((sesComp / sesTot) * 100) : 0;

  const parseDientes = () => {
    if (t.diente) return t.diente;
    try { return JSON.parse(t.dientes || '[]').join(', ') || '-'; } catch { return '-'; }
  };

  const handleCancelar = async () => {
    setCancelando(true);
    try { await onCancelar(t.id); }
    catch { setCancelando(false); setConfirmando(false); }
  };

  return (
    <div style={{
      background: 'white', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e9ecef',
      transition: 'box-shadow 0.15s', marginBottom: 10,
    }}>
      <div style={{ height: 3, background: est.color, opacity: 0.6 }} />
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: est.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`fas ${est.icon}`} style={{ color: est.color, fontSize: 18 }}></i>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{t.tipo || t.procedimiento || 'Tratamiento'}</span>
            <span style={{ background: est.bg, color: est.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{est.label}</span>
            {esMultisesion && (
              <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Multi-sesión</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span><i className="fas fa-calendar" style={{ marginRight: 4 }}></i>{t.fecha ? new Date(t.fecha).toLocaleDateString('es-HN') : '-'}</span>
            {pacienteVisible && <span><i className="fas fa-user" style={{ marginRight: 4 }}></i>{t.Paciente?.nombre || t.paciente_nombre || '-'}</span>}
            <span><i className="fas fa-tooth" style={{ marginRight: 4 }}></i>{parseDientes()}</span>
            {t.costo > 0 && <span><i className="fas fa-dollar-sign" style={{ marginRight: 4 }}></i>L. {parseFloat(t.costo).toFixed(2)}</span>}
          </div>
          {esMultisesion && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginBottom: 3 }}>
                <span>Progreso de sesiones</span>
                <span style={{ fontWeight: 700, color: BRAND.primary }}>{sesComp} de {sesTot} completadas</span>
              </div>
              <div style={{ background: '#e5e7eb', borderRadius: 20, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${progreso}%`, height: '100%', background: BRAND.gradient, borderRadius: 20, transition: 'width 0.4s' }} />
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setExpandido(e => !e)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className={`fas fa-chevron-${expandido ? 'up' : 'down'}`} style={{ fontSize: 10 }}></i>
            {expandido ? 'Ocultar' : 'Ver detalles'}
          </button>
          {t.estado !== 'cancelado' && (
            <>
              <button onClick={() => onEditar && onEditar(t)}
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <i className="fas fa-pen" style={{ marginRight: 4 }}></i>Editar
              </button>
              {!confirmando ? (
                <button onClick={() => setConfirmando(true)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <i className="fas fa-times" style={{ marginRight: 4 }}></i>Cancelar
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={handleCancelar} disabled={cancelando}
                    style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#dc2626', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    {cancelando ? '...' : 'Confirmar'}
                  </button>
                  <button onClick={() => setConfirmando(false)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: 11, cursor: 'pointer' }}>
                    No
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {expandido && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
            {[
              { label: 'Diagnóstico',   value: t.diagnostico || '-' },
              { label: 'Procedimiento', value: t.procedimiento || t.tipo || '-' },
              { label: 'Doctor',        value: t.Dentista ? `${t.Dentista.nombre} ${t.Dentista.apellidos||''}` : (dentistaInfo?.nombre || '-') },
              { label: 'Forma de pago', value: t.forma_pago || '-' },
              { label: 'Firma',         value: t.firma_digital || '-' },
              ...(esMultisesion ? [{ label: 'Objetivo', value: t.objetivo_general || '-' }] : []),
              ...(t.observaciones ? [{ label: 'Observaciones', value: t.observaciones, full: true }] : []),
            ].map((f, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: '1px solid #e5e7eb', gridColumn: f.full ? '1/-1' : undefined }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.value}</div>
              </div>
            ))}
          </div>
          {t.materiales && Array.isArray(t.materiales) && t.materiales.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Materiales usados</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {t.materiales.map((m, i) => (
                  <span key={i} style={{ background: '#f0effe', color: '#4f46e5', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{m}</span>
                ))}
              </div>
            </div>
          )}
          {esMultisesion && t.sesiones && Array.isArray(t.sesiones) && t.sesiones.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Sesiones registradas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {t.sesiones.map((s, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: '1px solid #e5e7eb', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.completada ? '#dcfce7' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`fas fa-${s.completada ? 'check' : 'clock'}`} style={{ fontSize: 11, color: s.completada ? '#166534' : '#2563eb' }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                        Sesión {i+1} — {s.fecha_realizada ? new Date(s.fecha_realizada).toLocaleDateString() : (s.fecha_programada ? new Date(s.fecha_programada).toLocaleDateString() : 'Sin fecha')}
                      </div>
                      {s.notas_evolucion && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.notas_evolucion}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
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
    fetch('http://localhost:3000/api/tratamientos/tratamientos', {
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
    fetch(`http://localhost:3000/api/tratamientos/pacientes/${pacienteId}/tratamientos`, {
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

  const handleCancelarTratamiento = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/tratamientos/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cancelado' }),
      });
      if (!res.ok) throw new Error('No se pudo cancelar');
      setTratKey(k => k + 1);
      mostrarToast('Tratamiento cancelado');
    } catch (err) {
      mostrarToast(err.message || 'Error al cancelar');
      throw err;
    }
  };

  // ── CAMBIO: PDF generado en frontend sin depender del backend ──
  const handleExportPDF = () => {
    if (!pacienteId) {
      setExportMsg('Selecciona un paciente para exportar.');
      setTimeout(() => setExportMsg(''), 2500);
      return;
    }
    exportarHistorialPDF(pacienteNombre || 'Paciente', pacienteId, listaActiva);
  };

  const cardStyle = {
    background: 'var(--color-background-secondary)', borderRadius: 12,
    padding: '20px 16px', border: '0.5px solid var(--color-border-tertiary)',
    display: 'flex', flexDirection: 'column', gap: 10,
  };
  const iconStyle = (bg) => ({ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' });

  return (
    <div className="dm20-page">

      {/* Header */}
      <div className="dm20-card" style={{ marginBottom: 20 }}>
        <div className="dm20-header">
          <div>
            <h2 className="dentista-titulo" style={{ margin: 0, fontWeight: 900, color: '#173067' }}>
              <i className="fas fa-tooth" style={{ marginRight: 10, color: BRAND.primary }}></i>
              Tratamientos
            </h2>
            <p className="dentista-texto-pequeno" style={{ margin: '4px 0 0', color: '#6b7280' }}>
              {pacienteNombre ? <>Paciente: <strong style={{ color: '#111827' }}>{pacienteNombre}</strong></> : 'Resumen clínico del día'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setShowNuevoTrat(true)}
              style={{ padding: '10px 18px', borderRadius: 12, background: BRAND.gradient, color: '#fff', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 16px rgba(79,70,229,0.25)' }}>
              <i className="fas fa-plus"></i> Nuevo tratamiento
            </button>
            <button onClick={handleExportPDF}
              style={{ padding: '10px 18px', borderRadius: 12, background: '#fff', color: BRAND.primary, border: `1.5px solid ${BRAND.primary}`, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-file-pdf"></i> Exportar PDF
            </button>
          </div>
        </div>
        {exportMsg && <div style={{ margin: '8px 0 0', color: BRAND.primary, fontWeight: 700, fontSize: 13 }}>{exportMsg}</div>}
      </div>

      {/* Estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={iconStyle('#E6F1FB')}><i className="fas fa-calendar-day" style={{ fontSize: 14, color: '#185FA5' }}></i></div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1 }}>{tratamientosHoy.length}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Tratamientos hoy</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>del día actual</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconStyle('#EAF3DE')}><i className="fas fa-check-circle" style={{ fontSize: 14, color: '#3B6D11' }}></i></div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 500, color: '#3B6D11', lineHeight: 1 }}>{realizadosHoy}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Realizados hoy</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>completados</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconStyle('#FAEEDA')}><i className="fas fa-clock" style={{ fontSize: 14, color: '#854F0B' }}></i></div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 500, color: '#854F0B', lineHeight: 1 }}>{planificadosHoy}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Planificados hoy</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>pendientes</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconStyle('#E1F5EE')}><i className="fas fa-dollar-sign" style={{ fontSize: 14, color: '#0F6E56' }}></i></div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 500, color: '#0F6E56', lineHeight: 1 }}>L. {costoTotal.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Costo acumulado</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>total registrado</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: 'white', borderRadius: 12, padding: '14px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {!pacienteId && (
          <input placeholder="Filtrar por paciente..." value={filtroPaciente} onChange={e => setFiltroPaciente(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, flex: 1, minWidth: 150 }} />
        )}
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}>
          <option value="">Tipo</option>
          {tiposUnicos.map((t, i) => <option key={i} value={t}>{t}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}>
          <option value="">Estado</option>
          <option value="planificado">Planificado</option>
          <option value="en_proceso">En proceso</option>
          <option value="realizado">Realizado</option>
        </select>
        <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }} />
        <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }} />
        <button onClick={() => { setFiltroTipo(''); setFiltroDesde(''); setFiltroHasta(''); setFiltroPaciente(''); setFiltroEstado(''); }}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
          Limpiar
        </button>
        {pacienteId && !pacienteIdProp && (
          <button onClick={() => { setPacienteId(null); setPacienteNombre(''); }}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #f87171', background: '#fef2f2', fontSize: 13, cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>
            <i className="fas fa-times" style={{ marginRight: 4 }}></i>Ver todos
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="dm20-card">
        <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="dentista-titulo" style={{ margin: 0, fontWeight: 800, color: '#173067' }}>
            {pacienteId ? `Tratamientos de ${pacienteNombre}` : 'Todos los tratamientos'}
          </h3>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {tratamientosFiltrados.length} resultado{tratamientosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          {loading ? (
            <div className="dm20-empty">Cargando tratamientos...</div>
          ) : listaActiva.length === 0 && !hayFiltros ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#f0effe,#ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="fas fa-tooth" style={{ fontSize: 28, color: BRAND.primary, opacity: 0.7 }}></i>
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#374151' }}>
                {pacienteId ? 'Sin tratamientos registrados' : 'No hay tratamientos hoy'}
              </h4>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#9ca3af' }}>
                {pacienteId ? 'Este paciente aún no tiene tratamientos en el sistema.' : 'Registra el primer tratamiento del día.'}
              </p>
              <button onClick={() => setShowNuevoTrat(true)}
                style={{ padding: '10px 24px', borderRadius: 12, background: BRAND.gradient, color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                <i className="fas fa-plus" style={{ marginRight: 8 }}></i>Registrar tratamiento
              </button>
            </div>
          ) : tratamientosFiltrados.length === 0 && hayFiltros ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9ca3af' }}>
              <i className="fas fa-filter" style={{ fontSize: 28, marginBottom: 10, display: 'block', opacity: 0.4 }}></i>
              <p style={{ margin: 0, fontSize: 13 }}>No hay tratamientos que coincidan con los filtros seleccionados.</p>
            </div>
          ) : (
            tratamientosFiltrados.map(t => (
              <TratamientoCard key={t.id} t={t} pacienteVisible={!pacienteId}
                onCancelar={handleCancelarTratamiento} onEditar={() => {}} dentistaInfo={dentistaInfo} />
            ))
          )}
        </div>
      </div>

      <NuevoTratamientoModal
        open={showNuevoTrat}
        onClose={() => setShowNuevoTrat(false)}
        onCreated={() => { setShowNuevoTrat(false); setTratKey(k => k + 1); }}
        pacienteId={pacienteId}
        pacienteNombre={pacienteNombre}
        onPacienteSeleccionado={(id, nombre) => { setPacienteId(id); setPacienteNombre(nombre); }}
      />

      {modalRx && (
        <VisualizadorDocumentos open={!!modalRx} documentos={[modalRx]} initialIndex={0} onClose={() => setModalRx(null)} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300, background: '#111827', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;