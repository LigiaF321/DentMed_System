import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import NuevoTratamientoModal from './NuevoTratamientoModal';
import VisualizadorDocumentos from './VisualizadorDocumentos';
import './MisPacientesScreen.css';

function MultiSesionViewer({ sesiones }) {
  const [idx, setIdx] = useState(0);
  const sesion = sesiones[idx];
  return (
    <div style={{ marginTop:12, padding:12, background:'#f7f7f7', borderRadius:8 }}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:8, gap:8 }}>
        <button onClick={() => setIdx(i=>Math.max(0,i-1))} disabled={idx===0}
          style={{ padding:'2px 8px', borderRadius:6, border:'1px solid #d1d5db', cursor:'pointer', background:'white' }}>&lt;</button>
        <span style={{ fontWeight:'bold' }}>Sesión {idx+1} de {sesiones.length}</span>
        <button onClick={() => setIdx(i=>Math.min(sesiones.length-1,i+1))} disabled={idx===sesiones.length-1}
          style={{ padding:'2px 8px', borderRadius:6, border:'1px solid #d1d5db', cursor:'pointer', background:'white' }}>&gt;</button>
      </div>
      <div style={{ fontSize:13 }}>
        <strong>Fecha:</strong> {new Date(sesion.fecha).toLocaleDateString()}<br/>
        <strong>Descripción:</strong> {sesion.descripcion}<br/>
        <strong>Observaciones:</strong> {sesion.observaciones}
      </div>
    </div>
  );
}

const getToken = () => localStorage.getItem('token') || '';

const ESTADO_STYLE = {
  realizado:   { bg:'#dcfce7', color:'#166534', label:'Realizado' },
  en_proceso:  { bg:'#fef9c3', color:'#854d0e', label:'En proceso' },
  planificado: { bg:'#eff6ff', color:'#1d4ed8', label:'Planificado' },
};

const TreatmentHistory = ({ pacienteId: pacienteIdProp, pacienteNombre: pacienteNombreProp, dentistaInfo }) => {

  const [todosLosTratamientos, setTodosLosTratamientos] = useState([]);
  const [loadingTodos,         setLoadingTodos]         = useState(false);
  const [tratamientosPaciente, setTratamientosPaciente] = useState([]);
  const [loadingPaciente,      setLoadingPaciente]      = useState(false);
  const [pacienteId,           setPacienteId]           = useState(pacienteIdProp || null);
  const [pacienteNombre,       setPacienteNombre]       = useState(pacienteNombreProp || '');
  const [tratKey,              setTratKey]              = useState(0);

  const [expandedId,    setExpandedId]    = useState(null);
  const [modalRx,       setModalRx]       = useState(null);
  const [showNuevoTrat, setShowNuevoTrat] = useState(false);
  const [exportMsg,     setExportMsg]     = useState('');

  const [filtroTipo,     setFiltroTipo]     = useState('');
  const [filtroDesde,    setFiltroDesde]    = useState('');
  const [filtroHasta,    setFiltroHasta]    = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');

  useEffect(() => {
    if (pacienteIdProp) {
      setPacienteId(pacienteIdProp);
      setPacienteNombre(pacienteNombreProp || '');
    }
  }, [pacienteIdProp, pacienteNombreProp]);

  useEffect(() => {
    setLoadingTodos(true);
    fetch('/api/tratamientos/tratamientos', {
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
    fetch(`/api/tratamientos/pacientes/${pacienteId}/tratamientos`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => setTratamientosPaciente(d.tratamientos || []))
      .catch(() => setTratamientosPaciente([]))
      .finally(() => setLoadingPaciente(false));
  }, [pacienteId, tratKey]);

  const listaActiva = pacienteId ? tratamientosPaciente : todosLosTratamientos;
  const loading     = pacienteId ? loadingPaciente : loadingTodos;

  // ── CAMBIO: estadísticas calculadas desde listaActiva, no todosLosTratamientos ──
  const hoy = new Date().toDateString();
  const tratamientosHoy = listaActiva.filter(t => new Date(t.fecha).toDateString() === hoy);
  const realizadosHoy   = tratamientosHoy.filter(t => t.estado === 'realizado').length;
  const planificadosHoy = tratamientosHoy.filter(t => t.estado === 'planificado').length;
  const costoTotal      = listaActiva.reduce((sum, t) => sum + (parseFloat(t.costo) || 0), 0);

  const tiposUnicos = Array.from(new Set(listaActiva.map(t => t.tipo).filter(Boolean)));

  const tratamientosFiltrados = listaActiva.filter(t => {
    const pac = t.Paciente?.nombre || t.paciente_nombre || '';
    return (
      (!filtroTipo     || t.tipo === filtroTipo) &&
      (!filtroDesde    || new Date(t.fecha) >= new Date(filtroDesde)) &&
      (!filtroHasta    || new Date(t.fecha) <= new Date(filtroHasta)) &&
      (!filtroPaciente || pac.toLowerCase().includes(filtroPaciente.toLowerCase()))
    );
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const handleExportPDF = async () => {
    if (!pacienteId) { setExportMsg('Selecciona un paciente para exportar.'); setTimeout(()=>setExportMsg(''),2500); return; }
    setExportMsg('Generando PDF...');
    try {
      const res = await fetch(`/api/tratamientos/exportar-pdf/${pacienteId}`, {
        method:'GET', headers:{ Authorization:`Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('No se pudo generar el PDF');
      saveAs(await res.blob(), `historial_tratamientos_${pacienteId}.pdf`);
      setExportMsg('PDF exportado correctamente');
    } catch { setExportMsg('Error al exportar PDF'); }
    setTimeout(()=>setExportMsg(''),2500);
  };

  const cardStyle = {
    background: 'var(--color-background-secondary)',
    borderRadius: 12,
    padding: '20px 16px',
    border: '0.5px solid var(--color-border-tertiary)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  };
  const iconStyle = (bg) => ({
    width: 36, height: 36, borderRadius: 8,
    background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  return (
    <div className="dm20-page">

      {/* ── Header ── */}
      <div className="dm20-card" style={{ marginBottom:20 }}>
        <div className="dm20-header">
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:'#173067' }}>
              <i className="fas fa-tooth" style={{ marginRight:10, color:'#2563eb' }}></i>
              Tratamientos
            </h2>
            <p style={{ margin:'4px 0 0', fontSize:13, color:'#6b7280' }}>
              {pacienteNombre
                ? <>Paciente: <strong style={{ color:'#111827' }}>{pacienteNombre}</strong></>
                : 'Resumen clínico del día'}
            </p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={()=>setShowNuevoTrat(true)}
              style={{ padding:'10px 18px', borderRadius:12, background:'linear-gradient(135deg,#2563eb,#3b82f6)', color:'#fff', border:'none', fontWeight:800, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 6px 16px rgba(37,99,235,0.22)' }}>
              <i className="fas fa-plus"></i> Nuevo tratamiento
            </button>
            <button onClick={handleExportPDF}
              style={{ padding:'10px 18px', borderRadius:12, background:'#fff', color:'#2563eb', border:'1.5px solid #2563eb', fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              <i className="fas fa-file-pdf"></i> Exportar PDF
            </button>
          </div>
        </div>
        {exportMsg && <div style={{ margin:'8px 0 0', color:'#2563eb', fontWeight:700, fontSize:13 }}>{exportMsg}</div>}
      </div>

      {/* ── Estadísticas ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>

        <div style={cardStyle}>
          <div style={iconStyle('#E6F1FB')}>
            <i className="fas fa-calendar-day" style={{ fontSize:14, color:'#185FA5' }}></i>
          </div>
          <div>
            <div style={{ fontSize:28, fontWeight:500, color:'var(--color-text-primary)', lineHeight:1 }}>
              {tratamientosHoy.length}
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:4 }}>
              Tratamientos hoy
            </div>
            <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginTop:2 }}>del día actual</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={iconStyle('#EAF3DE')}>
            <i className="fas fa-check-circle" style={{ fontSize:14, color:'#3B6D11' }}></i>
          </div>
          <div>
            <div style={{ fontSize:28, fontWeight:500, color:'#3B6D11', lineHeight:1 }}>
              {realizadosHoy}
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:4 }}>
              Realizados hoy
            </div>
            <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginTop:2 }}>completados</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={iconStyle('#FAEEDA')}>
            <i className="fas fa-clock" style={{ fontSize:14, color:'#854F0B' }}></i>
          </div>
          <div>
            <div style={{ fontSize:28, fontWeight:500, color:'#854F0B', lineHeight:1 }}>
              {planificadosHoy}
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:4 }}>
              Planificados hoy
            </div>
            <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginTop:2 }}>pendientes</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={iconStyle('#E1F5EE')}>
            <i className="fas fa-dollar-sign" style={{ fontSize:14, color:'#0F6E56' }}></i>
          </div>
          <div>
            <div style={{ fontSize:28, fontWeight:500, color:'#0F6E56', lineHeight:1 }}>
              L. {costoTotal.toFixed(2)}
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:4 }}>
              Costo acumulado
            </div>
            <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginTop:2 }}>total registrado</div>
          </div>
        </div>

      </div>

      {/* ── Filtros ── */}
      <div style={{ background:'white', borderRadius:12, padding:'14px 20px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.05)', border:'1px solid #e9ecef', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        {!pacienteId && (
          <input placeholder="Filtrar por paciente..."
            value={filtroPaciente} onChange={e=>setFiltroPaciente(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #d1d5db', fontSize:13, flex:1, minWidth:150 }} />
        )}
        <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #d1d5db', fontSize:13 }}>
          <option value="">Tipo</option>
          {tiposUnicos.map((t,i)=><option key={i} value={t}>{t}</option>)}
        </select>
        <input type="date" value={filtroDesde} onChange={e=>setFiltroDesde(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #d1d5db', fontSize:13 }} />
        <input type="date" value={filtroHasta} onChange={e=>setFiltroHasta(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #d1d5db', fontSize:13 }} />
        <button onClick={()=>{ setFiltroTipo(''); setFiltroDesde(''); setFiltroHasta(''); setFiltroPaciente(''); }}
          style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #d1d5db', background:'#f9fafb', fontSize:13, cursor:'pointer', color:'#374151' }}>
          Limpiar filtros
        </button>
        {pacienteId && !pacienteIdProp && (
          <button onClick={()=>{ setPacienteId(null); setPacienteNombre(''); }}
            style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #f87171', background:'#fef2f2', fontSize:13, cursor:'pointer', color:'#dc2626', fontWeight:700 }}>
            <i className="fas fa-times" style={{ marginRight:4 }}></i>Ver todos
          </button>
        )}
      </div>

      {/* ── Lista de tratamientos ── */}
      <div className="dm20-card">
        <div style={{ padding:'16px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'#173067' }}>
            {pacienteId ? `Tratamientos de ${pacienteNombre}` : 'Todos los tratamientos'}
          </h3>
          <span style={{ fontSize:12, color:'#6b7280' }}>
            {tratamientosFiltrados.length} resultado{tratamientosFiltrados.length!==1?'s':''}
          </span>
        </div>

        <div className="dm20-results">
          {loading ? (
            <div className="dm20-empty">Cargando tratamientos...</div>
          ) : tratamientosFiltrados.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px' }}>
              <div style={{ width:68, height:68, borderRadius:'50%', background:'linear-gradient(135deg,#dbeafe,#eff6ff)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 4px 16px rgba(37,99,235,0.1)' }}>
                <i className="fas fa-tooth" style={{ fontSize:26, color:'#2563eb', opacity:0.6 }}></i>
              </div>
              <h4 style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color:'#374151' }}>Sin tratamientos registrados</h4>
              <p style={{ margin:'0 0 18px', fontSize:13, color:'#9ca3af' }}>
                {pacienteId ? 'Este paciente aún no tiene tratamientos.' : 'No hay tratamientos para los filtros seleccionados.'}
              </p>
              <button onClick={()=>setShowNuevoTrat(true)}
                style={{ padding:'10px 22px', borderRadius:12, background:'linear-gradient(135deg,#2563eb,#3b82f6)', color:'white', border:'none', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 14px rgba(37,99,235,0.2)' }}>
                <i className="fas fa-plus" style={{ marginRight:8 }}></i>
                Registrar primer tratamiento
              </button>
            </div>
          ) : (
            <table className="dm20-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  {!pacienteId && <th>Paciente</th>}
                  <th>Tratamiento</th>
                  <th>Diente(s)</th>
                  <th>Estado</th>
                  <th>Costo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tratamientosFiltrados.map(t => {
                  const est = ESTADO_STYLE[t.estado] || ESTADO_STYLE['planificado'];
                  return (
                    <React.Fragment key={t.id}>
                      <tr>
                        <td>{t.fecha ? new Date(t.fecha).toLocaleDateString() : '-'}</td>
                        {!pacienteId && <td style={{ fontWeight:600 }}>{t.Paciente?.nombre || t.paciente_nombre || '-'}</td>}
                        <td>{t.tipo || t.procedimiento || '-'}</td>
                        <td>{t.diente || (t.dientes ? (() => { try { return JSON.parse(t.dientes).join(', '); } catch { return '-'; } })() : '-')}</td>
                        <td>
                          <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:est.bg, color:est.color }}>
                            {est.label}
                          </span>
                        </td>
                        <td>{t.costo ? `L. ${t.costo}` : '-'}</td>
                        <td>
                          <button className="dm20-btn-details" onClick={()=>setExpandedId(expandedId===t.id?null:t.id)}>
                            {expandedId===t.id ? 'Ocultar' : 'Ver detalles'}
                          </button>
                        </td>
                      </tr>

                      {expandedId===t.id && (
                        <tr className="treatment-details-row">
                          <td colSpan={pacienteId ? 6 : 7}>
                            <div style={{ background:'#f7f7f7', borderRadius:8, padding:18, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 24px', fontSize:13, color:'#1a2c3e' }}>
                                <div><strong>Diagnóstico:</strong> {t.diagnostico||'-'}</div>
                                <div><strong>Procedimiento:</strong> {t.procedimiento||t.tipo||'-'}</div>
                                <div><strong>Fecha:</strong> {t.fecha?new Date(t.fecha).toLocaleDateString():'-'}</div>
                                <div><strong>Diente(s):</strong> {t.diente||(t.dientes?(() => { try { return JSON.parse(t.dientes).join(', '); } catch { return '-'; } })():'-')}</div>
                                <div><strong>Doctor:</strong> {t.Dentista?`${t.Dentista.nombre} ${t.Dentista.apellidos||''}`:'-'}</div>
                                <div><strong>Costo:</strong> {t.costo?`L. ${t.costo}`:'-'}</div>
                                <div><strong>Forma de pago:</strong> {t.forma_pago||'-'}</div>
                                {t.firma_digital && <div><strong>Firma:</strong> {t.firma_digital}</div>}
                                {t.sesiones_totales > 1 && <div><strong>Sesiones:</strong> {t.sesiones_completadas||0} de {t.sesiones_totales} completadas</div>}
                                {t.observaciones && <div style={{ gridColumn:'1/-1' }}><strong>Observaciones:</strong> {t.observaciones}</div>}
                              </div>

                              {t.materiales && Array.isArray(t.materiales) && t.materiales.length>0 && (
                                <div style={{ marginTop:10 }}>
                                  <strong>Materiales usados:</strong>
                                  <ul style={{ margin:'4px 0 0 18px' }}>
                                    {t.materiales.map((m,i)=><li key={i} style={{ fontSize:13 }}>{m}</li>)}
                                  </ul>
                                </div>
                              )}

                              {t.radiografias && Array.isArray(t.radiografias) && t.radiografias.length>0 && (
                                <div style={{ marginTop:10 }}>
                                  <strong>Radiografías:</strong>
                                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:6 }}>
                                    {t.radiografias.map((rx,i) => rx.url ? (
                                      <img key={i} src={rx.url} alt={rx.nombre||`Radiografía ${i+1}`}
                                        style={{ width:60, height:60, objectFit:'cover', borderRadius:8, cursor:'pointer', border:'1px solid #e9ecef' }}
                                        onClick={()=>setModalRx(rx)} />
                                    ) : null)}
                                  </div>
                                </div>
                              )}

                              {t.sesiones && Array.isArray(t.sesiones) && t.sesiones.length>0 && (
                                <MultiSesionViewer sesiones={t.sesiones} />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── CAMBIO: se pasa pacienteNombre también para que el modal lo muestre ── */}
      <NuevoTratamientoModal
        open={showNuevoTrat}
        onClose={()=>setShowNuevoTrat(false)}
        onCreated={(data)=>{ setShowNuevoTrat(false); setTratKey(k=>k+1); }}
        pacienteId={pacienteId}
        pacienteNombre={pacienteNombre}
        onPacienteSeleccionado={(id, nombre) => { setPacienteId(id); setPacienteNombre(nombre); }}
      />

      {modalRx && (
        <VisualizadorDocumentos
          open={!!modalRx} documentos={[modalRx]} initialIndex={0}
          onClose={()=>setModalRx(null)}
        />
      )}
    </div>
  );
};

export default TreatmentHistory;