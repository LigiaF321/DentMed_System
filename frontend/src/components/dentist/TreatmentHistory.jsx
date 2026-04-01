import React, { useState } from "react";
import { saveAs } from "file-saver";
// Placeholder para el visualizador de documentos
// import VisualizadorDocumentos from "../documentos/VisualizadorDocumentos";

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
  // Aquí se obtendrán los tratamientos del paciente
  // const [tratamientos, setTratamientos] = React.useState([]);

  // Datos simulados de tratamientos
  const tratamientos = [
    {
      id: 1,
      fecha: "2026-03-28",
      tratamiento: "Endodoncia",
      dientes: "16, 17",
      doctor: "Dr. Juan Pérez",
      costo: 2500,
      diagnostico: "Necrosis pulpar. Dolor persistente.",
      observaciones: "Paciente refiere dolor nocturno. Se indicó antibiótico previo.",
      materiales: ["Lima K #25", "Hipoclorito de sodio", "Gutta-percha"],
      radiografias: [
        { id: 1, url: "https://dummyimage.com/80x80/cccccc/000000&text=RX1", nombre: "Periapical 1" },
        { id: 2, url: "https://dummyimage.com/80x80/cccccc/000000&text=RX2", nombre: "Periapical 2" }
      ],
      sesiones: [
        {
          id: 1,
          fecha: "2026-03-28",
          descripcion: "Apertura cameral, instrumentación, medicación temporal.",
          observaciones: "Paciente toleró bien el procedimiento.",
        },
        {
          id: 2,
          fecha: "2026-04-04",
          descripcion: "Obturación de conductos, control radiográfico.",
          observaciones: "Tratamiento finalizado con éxito.",
        }
      ],
    },
    {
      id: 2,
      fecha: "2026-03-20",
      tratamiento: "Obturación resina",
      dientes: "14",
      doctor: "Dr. Juan Pérez",
      costo: 800,
      diagnostico: "Caries dental. Lesión en esmalte.",
      observaciones: "Se utilizó resina compuesta de alta estética.",
      materiales: ["Resina Filtek", "Ácido ortofosfórico", "Adhesivo dental"],
      radiografias: [
        { id: 3, url: "https://dummyimage.com/80x80/cccccc/000000&text=RX3", nombre: "Bitewing" }
      ],
    },
    {
      id: 3,
      fecha: "2026-03-10",
      tratamiento: "Extracción",
      dientes: "18",
      doctor: "Dra. Ligia",
      costo: 1200,
      diagnostico: "Diente impactado.",
      observaciones: "Extracción sin complicaciones. Sutura absorbible.",
      materiales: ["Elevador", "Pinza de extracción", "Sutura absorbible"],
      radiografias: [],
    },
    {
      id: 4,
      fecha: "2026-02-28",
      tratamiento: "Limpieza dental",
      dientes: "-",
      doctor: "Dr. Juan Pérez",
      costo: 600,
      diagnostico: "Profilaxis preventiva.",
      observaciones: "Sin hallazgos patológicos.",
      materiales: ["Pasta profiláctica", "Cepillo dental"],
      radiografias: [],
    },
  ];

  const [expandedId, setExpandedId] = useState(null);
  const [exportMsg, setExportMsg] = useState("");
  const [modalRx, setModalRx] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroDoctor, setFiltroDoctor] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const handleExportPDF = async () => {
    setExportMsg("Generando PDF...");
    setTimeout(() => {
      const blob = new Blob(["PDF simulado del historial de tratamientos"], {
        type: "application/pdf",
      });
      saveAs(blob, "historial_tratamientos.pdf");
      setExportMsg("¡PDF exportado correctamente!");
      setTimeout(() => setExportMsg(""), 2500);
    }, 1500);
  };

  const tiposUnicos = Array.from(new Set(tratamientos.map((t) => t.tratamiento)));
  const doctoresUnicos = Array.from(new Set(tratamientos.map((t) => t.doctor)));

  const tratamientosFiltrados = tratamientos.filter((t) => {
    const cumpleTipo = !filtroTipo || t.tratamiento === filtroTipo;
    const cumpleDoctor = !filtroDoctor || t.doctor === filtroDoctor;
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
    <div className="treatment-history">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2>Historial de Tratamientos</h2>
        <button
          className="treatment-export-btn"
          onClick={handleExportPDF}
          style={{
            padding: "8px 18px",
            borderRadius: 6,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          <i className="fas fa-file-pdf" style={{ marginRight: 6 }}></i>
          Exportar a PDF
        </button>
      </div>

      {exportMsg && (
        <div style={{ margin: "10px 0", color: "#2563eb", fontWeight: "bold" }}>
          {exportMsg}
        </div>
      )}

      <div className="treatment-filters">
        <label>
          Tipo:
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos</option>
            {tiposUnicos.map((tipo, i) => (
              <option key={i} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>

        <label>
          Doctor:
          <select value={filtroDoctor} onChange={(e) => setFiltroDoctor(e.target.value)}>
            <option value="">Todos</option>
            {doctoresUnicos.map((doc, i) => (
              <option key={i} value={doc}>
                {doc}
              </option>
            ))}
          </select>
        </label>

        <label>
          Desde:
          <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
        </label>

        <label>
          Hasta:
          <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
        </label>

        <button
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

      <table className="treatment-table">
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
                <td>{new Date(t.fecha).toLocaleDateString()}</td>
                <td>{t.tratamiento}</td>
                <td>{t.dientes}</td>
                <td>{t.doctor}</td>
                <td>${t.costo}</td>
                <td>
                  <button className="treatment-expand-btn" onClick={() => handleExpand(t.id)}>
                    {expandedId === t.id ? "Ocultar" : "Ver detalles"}
                  </button>
                </td>
              </tr>

              {expandedId === t.id && (
                <tr className="treatment-details-row">
                  <td colSpan={6}>
                    <div className="treatment-details">
                      <strong>Diagnóstico:</strong> {t.diagnostico}
                      <br />
                      <strong>Observaciones:</strong> {t.observaciones}
                      <br />
                      <strong>Materiales usados:</strong>
                      <ul>
                        {t.materiales.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>

                      <div className="treatment-xrays-section">
                        <strong>Radiografías:</strong>
                        {t.radiografias && t.radiografias.length > 0 ? (
                          <div className="treatment-xrays-list">
                            {t.radiografias.map((rx) => (
                              <img
                                key={rx.id}
                                src={rx.url}
                                alt={rx.nombre}
                                title={rx.nombre}
                                className="treatment-xray-thumb"
                                style={{
                                  cursor: "pointer",
                                  marginRight: 8,
                                  border: "1px solid #aaa",
                                  borderRadius: 4,
                                }}
                                onClick={() => setModalRx(rx)}
                              />
                            ))}
                          </div>
                        ) : (
                          <span> No hay radiografías.</span>
                        )}
                      </div>

                      {t.sesiones && t.sesiones.length > 0 && (
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

      {modalRx && (
        <div
          className="treatment-xray-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              position: "relative",
              maxWidth: 500,
            }}
          >
            <button
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                fontSize: 18,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => setModalRx(null)}
            >
              &times;
            </button>

            <h3 style={{ marginTop: 0 }}>{modalRx.nombre}</h3>
            <img
              src={modalRx.url}
              alt={modalRx.nombre}
              style={{ maxWidth: "100%", maxHeight: 350, display: "block", margin: "0 auto" }}
            />
            <p style={{ textAlign: "center", marginTop: 12, color: "#888" }}>
              (Aquí se integrará el VisualizadorDocumentos)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;