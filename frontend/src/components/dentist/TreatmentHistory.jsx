import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import NuevoTratamientoModal from './NuevoTratamientoModal';
import VisualizadorDocumentos from './VisualizadorDocumentos';
import { buscarPacientes } from '../../services/pacientes.service';
import './MisPacientesScreen.css';

// ── Mini odontograma de solo lectura ─────────────────────────────────────────
const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

const MiniOdontogramaReadonly = ({ dientesMarcados = [] }) => {
  const Row = ({ teeth }) => (
    <div style={{ display:'flex', gap:2, flexWrap:'wrap', justifyContent:'center' }}>
      {teeth.map((n, i) => {
        const marcado = dientesMarcados.includes(n);
        const esSeparador = i === 7;
        return (
          <React.Fragment key={n}>
            {esSeparador && <div style={{ width:2, background:'#cbd5e1', margin:'0 3px', alignSelf:'stretch' }}/>}
            <div style={{
              width: 24, height: 24, borderRadius: 5,
              border: `1.5px solid ${marcado ? '#2563eb' : '#cbd5e1'}`,
              background: marcado ? '#dbeafe' : '#f8fafc',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize: 8, fontWeight: 700,
              color: marcado ? '#1d4ed8' : '#94a3b8',
            }}>{n}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
  return (
    <div style={{ background:'#f1f5f9', borderRadius:10, padding:10, border:'1px solid #e2e8f0' }}>
      <Row teeth={UPPER} />
      <div style={{ height:4 }}/>
      <Row teeth={LOWER} />
    </div>
  );
};

// ── Componente Multi-sesión ───────────────────────────────────────────────────
function MultiSesionViewer({ sesiones }) {
  const [idx, setIdx] = useState(0);
  const sesion = sesiones[idx];
  return (
    <div style={{ marginTop:12, padding:12, background:'#f7f7f7', borderRadius:8 }}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:8, gap:8 }}>
        <button onClick={() => setIdx((i) => Math.max(0,i-1))} disabled={idx===0}
          style={{ padding:'2px 8px', borderRadius:6, border:'1px solid #d1d5db', cursor:'pointer', background:'white' }}>&lt;</button>
        <span style={{ fontWeight:'bold' }}>Sesión {idx+1} de {sesiones.length}</span>
        <button onClick={() => setIdx((i) => Math.min(sesiones.length-1,i+1))} disabled={idx===sesiones.length-1}
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

// ── Componente principal ──────────────────────────────────────────────────────
const TreatmentHistory = ({ pacienteId: pacienteIdProp, pacienteNombre: pacienteNombreProp, dentistaInfo }) => {
  const [tratamientos,    setTratamientos]    = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [expandedId,      setExpandedId]      = useState(null);
  const [exportMsg,       setExportMsg]       = useState('');
  const [modalRx,         setModalRx]         = useState(null);
  const [filtroTipo,      setFiltroTipo]      = useState('');
  const [filtroDoctor,    setFiltroDoctor]    = useState('');
  const [filtroDesde,     setFiltroDesde]     = useState('');
  const [filtroHasta,     setFiltroHasta]     = useState('');
  const [showNuevoTrat,   setShowNuevoTrat]   = useState(false);
  const [tratKey,         setTratKey]         = useState(0);

  // Buscador de paciente (cuando no viene de la agenda)
  const [queryPaciente,   setQueryPaciente]   = useState('');
  const [resultados,      setResultados]      = useState([]);
  const [buscando,        setBuscando]        = useState(false);
  const [pacienteId,      setPacienteId]      = useState(pacienteIdProp || null);
  const [pacienteNombre,  setPacienteNombre]  = useState(pacienteNombreProp || '');

  // Sincronizar con prop
  useEffect(() => {
    if (pacienteIdProp) { setPacienteId(pacienteIdProp); setPacienteNombre(pacienteNombreProp || ''); }
  }, [pacienteIdProp, pacienteNombreProp]);

  // Búsqueda typeahead
  useEffect(() => {
    if (pacienteId) return;
    const q = queryPaciente.trim();
    if (q.length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await buscarPacientes(q);
        setResultados(res?.data || []);
      } catch { setResultados([]); }
      finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [queryPaciente, pacienteId]);

  // Cargar tratamientos
  useEffect(() => {
    if (!pacienteId) { setTratamientos([]); return; }
    setLoading(true);
    fetch(`/api/tratamientos/pacientes/${pacienteId}/tratamientos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((r) => r.json())
      .then((d) => setTratamientos(d.tratamientos || []))
      .catch(() => setTratamientos([]))
      .finally(() => setLoading(false));
  }, [pacienteId, tratKey]);

  const handleExportPDF = async () => {
    if (!pacienteId) { setExportMsg('No hay paciente seleccionado.'); setTimeout(() => setExportMsg(''), 2500); return; }
    setExportMsg('Generando PDF...');
    try {
      const res = await fetch(`/api/tratamientos/exportar-pdf/${pacienteId}`, {
        method: 'GET', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (!res.ok) throw new Error('No se pudo generar el PDF');
      const blob = await res.blob();
      saveAs(blob, `historial_tratamientos_${pacienteId}.pdf`);
      setExportMsg('¡PDF exportado correctamente!');
    } catch { setExportMsg('Error al exportar PDF'); }
    setTimeout(() => setExportMsg(''), 2500);
  };

  const tiposUnicos   = Array.from(new Set(tratamientos.map((t) => t.tipo).filter(Boolean)));
  const doctoresUnicos = Array.from(new Set(
    tratamientos.map((t) => t.Dentista ? `${t.Dentista.nombre} ${t.Dentista.apellidos||''}`.trim() : null).filter(Boolean)
  ));

  const tratamientosFiltrados = tratamientos.filter((t) => {
    const doc = t.Dentista ? `${t.Dentista.nombre} ${t.Dentista.apellidos||''}`.trim() : '';
    return (
      (!filtroTipo   || t.tipo === filtroTipo) &&
      (!filtroDoctor || doc === filtroDoctor) &&
      (!filtroDesde  || new Date(t.fecha) >= new Date(filtroDesde)) &&
      (!filtroHasta  || new Date(t.fecha) <= new Date(filtroHasta))
    );
  });

  const tratamientosOrdenados = [...tratamientosFiltrados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // Todos los dientes marcados para el odontograma readonly
  const dientesMarcados = tratamientos.flatMap((t) => {
    try { return JSON.parse(t.dientes || '[]'); } catch { return []; }
  });

  return (
    <div className="dm20-page">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="dm20-card" style={{ marginBottom: 20 }}>
        <div className="dm20-header">
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:'#173067' }}>
              <i className="fas fa-tooth" style={{ marginRight:10, color:'#2563eb' }}></i>
              Tratamientos
            </h2>
            {pacienteNombre && (
              <p style={{ margin:'4px 0 0', fontSize:14, color:'#6b7280', fontWeight:600 }}>
                Paciente: <strong style={{ color:'#111827' }}>{pacienteNombre}</strong>
              </p>
            )}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {pacienteId && (
              <button
                onClick={() => setShowNuevoTrat(true)}
                style={{
                  padding:'10px 18px', borderRadius:12,
                  background:'linear-gradient(135deg,#2563eb,#3b82f6)',
                  color:'#fff', border:'none', fontWeight:800, fontSize:14,
                  cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                  boxShadow:'0 6px 16px rgba(37,99,235,0.22)',
                }}>
                <i className="fas fa-plus"></i> Nuevo tratamiento
              </button>
            )}
            <button onClick={handleExportPDF}
              style={{
                padding:'10px 18px', borderRadius:12,
                background:'#fff', color:'#2563eb',
                border:'1.5px solid #2563eb', fontWeight:700, fontSize:14,
                cursor:'pointer', display:'flex', alignItems:'center', gap:8,
              }}>
              <i className="fas fa-file-pdf"></i> Exportar PDF
            </button>
          </div>
        </div>

        {exportMsg && <div style={{ margin:'8px 0', color:'#2563eb', fontWeight:700 }}>{exportMsg}</div>}

        {/* ── Buscador de paciente (si no viene de la agenda) ── */}
        {!pacienteId && (
          <div style={{ marginTop:16 }}>
            <label style={{ fontSize:13, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>
              Buscar paciente
            </label>
            <div style={{ position:'relative' }}>
              <input
                value={queryPaciente}
                onChange={(e) => setQueryPaciente(e.target.value)}
                placeholder="Nombre, teléfono o correo..."
                style={{
                  width:'100%', padding:'10px 14px', borderRadius:10,
                  border:'1px solid #d1d5db', fontSize:14, boxSizing:'border-box',
                }}
              />
              {buscando && <span style={{ position:'absolute', right:12, top:10, fontSize:12, color:'#6b7280' }}>Buscando...</span>}
            </div>
            {resultados.length > 0 && (
              <div style={{ border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden', marginTop:4 }}>
                {resultados.map((p) => (
                  <div key={p.id} onClick={() => { setPacienteId(p.id); setPacienteNombre(p.nombre); setQueryPaciente(''); setResultados([]); }}
                    style={{
                      padding:'10px 14px', cursor:'pointer', fontSize:13,
                      borderBottom:'1px solid #f3f4f6', background:'white',
                      display:'flex', justifyContent:'space-between',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background='#eff6ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background='white'}>
                    <strong>{p.nombre}</strong>
                    <span style={{ color:'#6b7280' }}>{p.telefono || p.email || ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Botón limpiar selección ── */}
        {pacienteId && !pacienteIdProp && (
          <button onClick={() => { setPacienteId(null); setPacienteNombre(''); setQueryPaciente(''); }}
            style={{ marginTop:10, background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:12, textDecoration:'underline' }}>
            Cambiar paciente
          </button>
        )}
      </div>

      {/* ── Odontograma solo lectura ────────────────────────────────────────── */}
      {pacienteId && tratamientos.length > 0 && (
        <div className="dm20-card" style={{ marginBottom:20, padding:20 }}>
          <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:800, color:'#173067' }}>
            <i className="fas fa-tooth" style={{ marginRight:8, color:'#2563eb' }}></i>
            Dientes con tratamientos registrados
          </h3>
          <MiniOdontogramaReadonly dientesMarcados={dientesMarcados} />
        </div>
      )}

      {/* ── Tabla de tratamientos ───────────────────────────────────────────── */}
      {pacienteId && (
        <div className="dm20-card">
          <div style={{ padding:'16px 20px 0' }}>
            <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:800, color:'#173067' }}>
              Historial de tratamientos
            </h3>
          </div>

          <div className="dm20-filters" style={{ padding:'0 20px 12px' }}>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Tipo</option>
              {tiposUnicos.map((t, i) => <option key={i} value={t}>{t}</option>)}
            </select>
            <select value={filtroDoctor} onChange={(e) => setFiltroDoctor(e.target.value)}>
              <option value="">Doctor</option>
              {doctoresUnicos.map((d, i) => <option key={i} value={d}>{d}</option>)}
            </select>
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
            <button type="button" onClick={() => { setFiltroTipo(''); setFiltroDoctor(''); setFiltroDesde(''); setFiltroHasta(''); }}>
              Limpiar filtros
            </button>
          </div>

          <div className="dm20-results">
            {loading ? (
              <div className="dm20-empty">Cargando tratamientos...</div>
            ) : tratamientosOrdenados.length === 0 ? (
              <div className="dm20-empty">No hay tratamientos registrados.</div>
            ) : (
              <table className="dm20-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tratamiento</th>
                    <th>Diente(s)</th>
                    <th>Doctor</th>
                    <th>Estado</th>
                    <th>Costo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tratamientosOrdenados.map((t) => (
                    <React.Fragment key={t.id}>
                      <tr>
                        <td>{t.fecha ? new Date(t.fecha).toLocaleDateString() : '-'}</td>
                        <td>{t.tipo || t.procedimiento || '-'}</td>
                        <td>{t.diente || (t.dientes ? JSON.parse(t.dientes||'[]').join(', ') : '-')}</td>
                        <td>{t.Dentista ? `${t.Dentista.nombre} ${t.Dentista.apellidos||''}` : (dentistaInfo?.nombre || '-')}</td>
                        <td>
                          <span style={{
                            padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                            background: t.estado==='realizado' ? '#dcfce7' : t.estado==='en_proceso' ? '#fef9c3' : '#eff6ff',
                            color: t.estado==='realizado' ? '#166534' : t.estado==='en_proceso' ? '#854d0e' : '#1d4ed8',
                          }}>
                            {t.estado || 'planificado'}
                          </span>
                        </td>
                        <td>{t.costo ? `L. ${t.costo}` : '-'}</td>
                        <td>
                          <button className="dm20-btn-details" onClick={() => setExpandedId(expandedId===t.id ? null : t.id)}>
                            {expandedId===t.id ? 'Ocultar' : 'Ver detalles'}
                          </button>
                        </td>
                      </tr>

                      {expandedId===t.id && (
                        <tr className="treatment-details-row">
                          <td colSpan={7}>
                            <div style={{ background:'#f7f7f7', borderRadius:8, padding:18, marginTop:8, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                              <div style={{ fontSize:15, color:'#1a2c3e', marginBottom:6 }}>
                                <strong>Diagnóstico:</strong> {t.diagnostico || '-'}<br/>
                                <strong>Procedimiento:</strong> {t.procedimiento || t.tipo || '-'}<br/>
                                <strong>Fecha:</strong> {t.fecha ? new Date(t.fecha).toLocaleDateString() : '-'}<br/>
                                <strong>Diente(s):</strong> {t.diente || (t.dientes ? JSON.parse(t.dientes||'[]').join(', ') : '-')}<br/>
                                <strong>Doctor:</strong> {t.Dentista ? `${t.Dentista.nombre} ${t.Dentista.apellidos||''}` : '-'}<br/>
                                <strong>Costo:</strong> {t.costo ? `L. ${t.costo}` : '-'}<br/>
                                <strong>Forma de pago:</strong> {t.forma_pago || '-'}<br/>
                                {t.observaciones && <><strong>Observaciones:</strong> {t.observaciones}<br/></>}
                                {t.firma_digital && <><strong>Firma:</strong> {t.firma_digital}<br/></>}
                                {t.sesiones_totales > 1 && (
                                  <><strong>Sesiones:</strong> {t.sesiones_completadas || 0} de {t.sesiones_totales} completadas<br/></>
                                )}
                              </div>

                              {t.materiales && Array.isArray(t.materiales) && t.materiales.length > 0 && (
                                <>
                                  <strong>Materiales usados:</strong>
                                  <ul style={{ margin:'4px 0 0 18px' }}>
                                    {t.materiales.map((m, i) => <li key={i}>{m}</li>)}
                                  </ul>
                                </>
                              )}

                              {t.radiografias && Array.isArray(t.radiografias) && t.radiografias.length > 0 && (
                                <div style={{ marginTop:10 }}>
                                  <strong>Radiografías:</strong>
                                  <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:6 }}>
                                    {t.radiografias.map((rx, i) => rx.url ? (
                                      <img key={i} src={rx.url} alt={rx.nombre || `Radiografía ${i+1}`}
                                        style={{ width:60, height:60, objectFit:'cover', borderRadius:8, cursor:'pointer', border:'1px solid #e9ecef' }}
                                        onClick={() => setModalRx(rx)} />
                                    ) : null)}
                                  </div>
                                </div>
                              )}

                              {t.sesiones && Array.isArray(t.sesiones) && t.sesiones.length > 0 && (
                                <MultiSesionViewer sesiones={t.sesiones} />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Estado vacío sin paciente ─────────────────────────────────────── */}
      {!pacienteId && !queryPaciente && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'#9ca3af' }}>
          <i className="fas fa-tooth" style={{ fontSize:48, marginBottom:16, display:'block', opacity:0.3 }}></i>
          <p style={{ fontSize:16, margin:0 }}>Selecciona un paciente para ver sus tratamientos</p>
          <p style={{ fontSize:13, margin:'6px 0 0' }}>Puedes venir desde Mi Agenda o buscar un paciente arriba</p>
        </div>
      )}

      {/* ── Modal nuevo tratamiento ───────────────────────────────────────── */}
      <NuevoTratamientoModal
        open={showNuevoTrat}
        onClose={() => setShowNuevoTrat(false)}
        onCreated={() => { setShowNuevoTrat(false); setTratKey((k) => k+1); }}
        pacienteId={pacienteId}
      />

      {modalRx && (
        <VisualizadorDocumentos
          open={!!modalRx}
          documentos={[modalRx]}
          initialIndex={0}
          onClose={() => setModalRx(null)}
        />
      )}
    </div>
  );
};

export default TreatmentHistory;