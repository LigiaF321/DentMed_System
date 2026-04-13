import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import './MisPacientesScreen.css';
import VisualizadorDocumentos from './VisualizadorDocumentos';

function MultiSesionViewer({ sesiones }) {
  const [idx, setIdx] = useState(0);
  const sesion = sesiones[idx];

  return (
    <div
      className="multi-sesion-viewer"
      style={{ marginTop: 16, padding: 12, background: "#f7f7f7", borderRadius: 8 }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          style={{ marginRight: 8 }}
        >
          &lt;
        </button>

        <span style={{ fontWeight: "bold" }}>
          Sesión {idx + 1} de {sesiones.length}
        </span>

        <button
          onClick={() => setIdx((i) => Math.min(sesiones.length - 1, i + 1))}
          disabled={idx === sesiones.length - 1}
          style={{ marginLeft: 8 }}
        >
          &gt;
        </button>
      </div>

      <div>
        <strong>Fecha:</strong> {new Date(sesion.fecha).toLocaleDateString()}
        <br />
        <strong>Descripción:</strong> {sesion.descripcion}
        <br />
        <strong>Observaciones:</strong> {sesion.observaciones}
      </div>
    </div>
  );
}

const TreatmentHistory = ({ pacienteId }) => {
  const [tratamientos, setTratamientos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pacienteId) return;
    setLoading(true);
    fetch(`/api/tratamientos/pacientes/${pacienteId}/tratamientos`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setTratamientos(data.tratamientos || []);
        setLoading(false);
      })
      .catch(() => {
        setTratamientos([]);
        setLoading(false);
      });
  }, [pacienteId]);

  const [expandedId, setExpandedId] = useState(null);
  const [exportMsg, setExportMsg] = useState("");
  const [modalRx, setModalRx] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroDoctor, setFiltroDoctor] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const handleExportPDF = async () => {
    if (!pacienteId) {
      setExportMsg("No hay paciente seleccionado.");
      setTimeout(() => setExportMsg(""), 2500);
      return;
    }
    setExportMsg("Generando PDF...");
    try {
      const res = await fetch(`/api/tratamientos/exportar-pdf/${pacienteId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (!res.ok) throw new Error('No se pudo generar el PDF');
      const blob = await res.blob();
      saveAs(blob, `historial_tratamientos_${pacienteId}.pdf`);
      setExportMsg("¡PDF exportado correctamente!");
    } catch (err) {
      setExportMsg("Error al exportar PDF");
    }
    setTimeout(() => setExportMsg(""), 2500);
  };

  const tiposUnicos = Array.from(new Set(tratamientos.map((t) => t.tipo).filter(Boolean)));

  const doctoresUnicos = Array.from(
    new Set(
      tratamientos
        .map((t) => t.Dentista ? `${t.Dentista.nombre} ${t.Dentista.apellidos || ''}`.trim() : null)
        .filter(Boolean)
    )
  );

  const tratamientosFiltrados = tratamientos.filter((t) => {
    const cumpleTipo = !filtroTipo || t.tipo === filtroTipo;
    const nombreDoctor = t.Dentista ? `${t.Dentista.nombre} ${t.Dentista.apellidos || ''}`.trim() : '';
    const cumpleDoctor = !filtroDoctor || nombreDoctor === filtroDoctor;
    const cumpleDesde = !filtroDesde || new Date(t.fecha) >= new Date(filtroDesde);
    const cumpleHasta = !filtroHasta || new Date(t.fecha) <= new Date(filtroHasta);
    return cumpleTipo && cumpleDoctor && cumpleDesde && cumpleHasta;
  });

  const tratamientosOrdenados = [...tratamientosFiltrados].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha)
  );

  const handleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="dm20-page">
      <div className="dm20-card">
        <div className="dm20-header">
          <div>
            <h2>Historial de Tratamientos</h2>
            <p>Consulta y filtra todos los tratamientos registrados en el sistema.</p>
          </div>
          <button
            className="treatment-export-btn"
            onClick={handleExportPDF}
            style={{
              padding: "10px 22px",
              borderRadius: 12,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: "bold",
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37,99,235,0.08)"
            }}
          >
            <i className="fas fa-file-pdf" style={{ marginRight: 8 }}></i>
            Exportar a PDF
          </button>
        </div>

        {exportMsg && (
          <div style={{ margin: "10px 0", color: "#2563eb", fontWeight: "bold" }}>{exportMsg}</div>
        )}

        <div className="dm20-filters">
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Tipo</option>
            {tiposUnicos.map((tipo, i) => (
              <option key={i} value={tipo}>{tipo}</option>
            ))}
          </select>

          <select value={filtroDoctor} onChange={(e) => setFiltroDoctor(e.target.value)}>
            <option value="">Doctor</option>
            {doctoresUnicos.map((doc, i) => (
              <option key={i} value={doc}>{doc}</option>
            ))}
          </select>

          <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
          <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />

          <button
            type="button"
            onClick={() => {
              setFiltroTipo("");
              setFiltroDoctor("");
              setFiltroDesde("");
              setFiltroHasta("");
            }}
          >
            Limpiar filtros
          </button>
        </div>

        <div className="dm20-results">
          {tratamientosOrdenados.length === 0 ? (
            <div className="dm20-empty">No hay tratamientos registrados.</div>
          ) : (
            <table className="dm20-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tratamiento</th>
                  <th>Diente(s)</th>
                  <th>Doctor</th>
                  <th>Costo</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {tratamientosOrdenados.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr>
                      <td>{t.fecha ? new Date(t.fecha).toLocaleDateString() : '-'}</td>
                      <td>{t.tipo || '-'}</td>
                      <td>{t.diente || '-'}</td>
                      <td>{t.Dentista ? `${t.Dentista.nombre} ${t.Dentista.apellidos || ''}` : '-'}</td>
                      <td>${t.costo || '-'}</td>
                      <td>
                        <button
                          className="dm20-btn-details"
                          onClick={() => handleExpand(t.id)}
                        >
                          {expandedId === t.id ? "Ocultar" : "Ver detalles"}
                        </button>
                      </td>
                    </tr>

                    {expandedId === t.id && (
                      <tr className="treatment-details-row">
                        <td colSpan={6}>
                          <div className="treatment-details" style={{
                            background: '#f7f7f7',
                            borderRadius: 8,
                            padding: 18,
                            marginTop: 8,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}>
                            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#2563eb' }}>
                              Detalles del tratamiento
                            </div>

                            <div style={{ fontSize: 15, color: '#1a2c3e', marginBottom: 6 }}>
                              <strong>Tipo:</strong> {t.tipo || '-'}<br />
                              <strong>Fecha:</strong> {t.fecha ? new Date(t.fecha).toLocaleDateString() : '-'}<br />
                              <strong>Diente:</strong> {t.diente || '-'}<br />
                              <strong>Doctor:</strong> {t.Dentista ? `${t.Dentista.nombre} ${t.Dentista.apellidos || ''}` : '-'}<br />
                              <strong>Costo:</strong> ${t.costo || '-'}<br />
                              <strong>Descripción:</strong> {t.descripcion || '-'}<br />

                              {t.diagnostico && (<><strong>Diagnóstico:</strong> {t.diagnostico}<br /></>)}
                              {t.observaciones && (<><strong>Observaciones:</strong> {t.observaciones}<br /></>)}

                              {t.materiales && Array.isArray(t.materiales) && t.materiales.length > 0 && (
                                <>
                                  <strong>Materiales usados:</strong>
                                  <ul style={{ margin: '4px 0 0 18px' }}>
                                    {t.materiales.map((m, i) => <li key={i}>{m}</li>)}
                                  </ul>
                                </>
                              )}

                              {t.radiografias && Array.isArray(t.radiografias) && t.radiografias.length > 0 && (
                                <div style={{ marginTop: 10 }}>
                                  <strong>Radiografías:</strong>
                                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                                    {t.radiografias.map((rx, i) => (
                                      rx.url ? (
                                        <img
                                          key={i}
                                          src={rx.url}
                                          alt={rx.nombre || `Radiografía ${i+1}`}
                                          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '1px solid #e9ecef' }}
                                          onClick={() => setModalRx(rx)}
                                        />
                                      ) : null
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

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
}

export default TreatmentHistory;