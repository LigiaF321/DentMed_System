import React from "react";
import "./AuditScreen.css";
import TimelineScreen from "./TimelineScreen";

export default function AuditScreen() {
  // Exportar a CSV
  const exportarCSV = () => {
    const encabezados = ["Fecha y Hora","Usuario","Rol","Acción","Módulo","Detalle","IP"];
    const filas = resultadosFiltrados.map(ev => [ev.fecha, ev.usuario, ev.rol, ev.accion, ev.modulo, ev.detalle, ev.ip]);
    let csv = encabezados.join(",") + "\n";
    filas.forEach(fila => {
      csv += fila.map(val => `"${(val || "").replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auditoria.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Exportar a PDF (jsPDF)
  const exportarPDF = async () => {
    const encabezados = ["Fecha y Hora","Usuario","Rol","Acción","Módulo","Detalle","IP"];
    const filas = resultadosFiltrados.map(ev => [ev.fecha, ev.usuario, ev.rol, ev.accion, ev.modulo, ev.detalle, ev.ip]);
    // Cargar jsPDF dinámicamente si no está en window
    let jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) {
      jsPDF = (await import('jspdf')).jsPDF;
    }
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(12);
    doc.text('Resultados de Auditoría', 10, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(encabezados, 10, y);
    y += 7;
    filas.forEach(fila => {
      doc.text(fila.map(val => String(val || "")).slice(0,7), 10, y);
      y += 7;
      if (y > 270) { doc.addPage(); y = 15; }
    });
    doc.save('auditoria.pdf');
  };

  // Datos simulados de resultados (debe ir antes de los hooks que lo usan)
  const auditResults = [
    {
      fecha: "21/02/2026 10:35:22",
      usuario: "jperez",
      rol: "Dentista",
      accion: "Crear cita",
      modulo: "Citas",
      detalle: "Paciente: María González",
      ip: "10.0.0.12"
    },
    {
      fecha: "20/02/2026 09:15:10",
      usuario: "admin",
      rol: "Admin",
      accion: "Configurar",
      modulo: "Horarios",
      detalle: "Cambio horario sábado",
      ip: "10.0.0.5"
    }
  ];

  // Estados para filtros
  const [filtros, setFiltros] = React.useState({
    usuario: '', // select
    usuarioBusqueda: '', // input
    rol: '',
    fechaDesde: '',
    fechaHasta: '',
    accion: '',
    modulo: '',
    resultado: '',
    ip: '',
    termino: ''
  });
  const [resultadosFiltrados, setResultadosFiltrados] = React.useState(auditResults);

    // Manejar cambios en los filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

    // Buscar (filtrar resultados)
  const handleBuscar = () => {
    let filtrados = auditResults.filter(ev => {
      return (
        (!filtros.usuario || ev.usuario === filtros.usuario) &&
        (!filtros.usuarioBusqueda || ev.usuario.toLowerCase().includes(filtros.usuarioBusqueda.toLowerCase())) &&
        (!filtros.rol || ev.rol === filtros.rol || filtros.rol === 'TODOS') &&
        (!filtros.accion || ev.accion === filtros.accion) &&
        (!filtros.modulo || ev.modulo === filtros.modulo || filtros.modulo === 'TODOS') &&
        (!filtros.resultado || filtros.resultado === 'TODOS') &&
        (!filtros.ip || ev.ip.includes(filtros.ip)) &&
        (!filtros.termino || ev.detalle.toLowerCase().includes(filtros.termino.toLowerCase()))
      );
    });
    setResultadosFiltrados(filtrados);
  };

    // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      usuario: '',
      usuarioBusqueda: '',
      rol: '',
      fechaDesde: '',
      fechaHasta: '',
      accion: '',
      modulo: '',
      resultado: '',
      ip: '',
      termino: ''
    });
    setResultadosFiltrados(auditResults);
  };
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalData, setModalData] = React.useState(null);

  // Funciones para los botones del modal
  const handleVerEventosSimilares = () => {
    if (!modalData) return;
    setFiltros((prev) => ({
      ...prev,
      usuario: modalData.usuario,
      accion: modalData.accion,
      usuarioBusqueda: '',
      ip: '',
      termino: ''
    }));
    setResultadosFiltrados(auditResults.filter(ev => ev.usuario === modalData.usuario && ev.accion === modalData.accion));
    setModalOpen(false);
  };

  const handleBuscarPorIP = () => {
    if (!modalData) return;
    setFiltros((prev) => ({
      ...prev,
      ip: modalData.ip,
      usuario: '',
      usuarioBusqueda: '',
      accion: '',
      termino: ''
    }));
    setResultadosFiltrados(auditResults.filter(ev => ev.ip === modalData.ip));
    setModalOpen(false);
  };

  const handleVerActividadUsuario = () => {
    if (!modalData) return;
    setFiltros((prev) => ({
      ...prev,
      usuario: modalData.usuario,
      usuarioBusqueda: '',
      ip: '',
      accion: '',
      termino: ''
    }));
    setResultadosFiltrados(auditResults.filter(ev => ev.usuario === modalData.usuario));
    setModalOpen(false);
  };
  const [timelineOpen, setTimelineOpen] = React.useState(false);
  const [timelineUser, setTimelineUser] = React.useState({ usuario: '', nombre: '' });

  // Ejemplo de evento para el modal
  const exampleEvent = {
    id: 1,
    fecha: "21/02/2026 10:35:22",
    usuario: "jperez",
    nombreCompleto: "Dr. Juan Pérez",
    rol: "Dentista",
    ip: "10.0.0.12",
    modulo: "Citas",
    accion: "Crear cita",
    descripcion: "Paciente: María González",
    infoAdicional: {
      pacienteId: "1234",
      fechaCita: "21/02/2026",
      doctor: "Dr. Juan Pérez",
      consultorio: "A1",
      estado: "Confirmada"
    },
    metadatos: { browser: "Chrome", sistema: "Windows", version: "1.0.0" }
  };


  // Datos simulados para la tabla de eventos de la línea de tiempo
  const timelineEvents = [
    {
      fecha: "21/02/2026",
      hora: "10:35",
      accion: "Inicio de sesión",
      modulo: "Login"
    },
    {
      fecha: "21/02/2026",
      hora: "10:15",
      accion: "Crear cita - M. González",
      modulo: "Citas"
    }
  ];

  // Filtros simulados
  const usuarios = [
    { id: "all", username: "TODOS LOS USUARIOS", nombre: "" },
    { id: "admin1", username: "admin1", nombre: "Juan Pérez (Admin)" },
    { id: "dentista1", username: "dentista1", nombre: "Ana López (Dentista)" },
    { id: "sistema", username: "Sistema", nombre: "Acciones automáticas" },
  ];
  const roles = ["TODOS", "Administrador", "Dentista", "Sistema"];
  const acciones = [
    { group: "SESIÓN", items: ["Inicio sesión", "Cierre sesión", "Intento fallido"] },
    { group: "CITAS", items: ["Crear cita", "Editar cita", "Cancelar cita", "Ver cita"] },
    { group: "DENTISTAS", items: ["Crear dentista", "Editar dentista", "Inhabilitar dentista", "Eliminar dentista"] },
    { group: "INSUMOS", items: ["Crear insumo", "Editar insumo", "Activar/Inactivar insumo"] },
    { group: "INVENTARIO", items: ["Entrada", "Salida", "Ajuste"] },
    { group: "CONFIGURACIÓN", items: ["Cambiar parámetros", "Configurar horarios"] },
    { group: "REPORTES", items: ["Generar reporte", "Exportar reporte"] },
    { group: "SEGURIDAD", items: ["Alerta generada", "Alerta silenciada", "IP bloqueada"] },
  ];
  const modulos = ["TODOS", "Login", "Dashboard", "Dentistas", "Citas", "Pacientes", "Inventario", "Insumos", "Reportes", "Configuración", "Seguridad", "Auditoría"];
  const resultados = ["TODOS", "Éxito", "Fallido", "Bloqueado", "Advertencia"];

  // Inputs y selects modernos, redondeados y suaves
  const inputStyle = {
    borderRadius: '12px',
    border: '1.5px solid #e0e3f1',
    padding: '10px 18px',
    fontSize: '16px',
    color: '#1a2366',
    background: '#fff',
    marginTop: '2px',
    marginBottom: '2px',
    boxShadow: '0 2px 8px rgba(79,70,229,0.07)'
  };

  return (
    <div className="dm2-page">
      <div className="dm2-card">
        <div className="dm2-card-head">
          <div className="audit-header">
            <span className="audit-header-title" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a2366' }}>AUDITORÍA Y CONSULTA DE ACTIVIDAD</span>
          </div>
        </div>
        <div className="dm2-card-body">
          {/* Filtros de búsqueda con inputs/selects estilizados */}
          <div className="audit-filters-panel">
            <div className="audit-filters-row">
              <div className="audit-filter">
                <label>Usuario</label>
                <select style={inputStyle} name="usuario" value={filtros.usuario} onChange={handleFiltroChange}>
                  <option value="">TODOS LOS USUARIOS</option>
                  {usuarios.map((u) => (<option key={u.id} value={u.username}>{u.username}</option>))}
                </select>
                <input type="text" name="usuarioBusqueda" placeholder="Buscar usuario..." style={inputStyle} value={filtros.usuarioBusqueda} onChange={handleFiltroChange} />
              </div>
              <div className="audit-filter">
                <label>Rol</label>
                <select style={inputStyle} name="rol" value={filtros.rol} onChange={handleFiltroChange}>
                  <option value="">TODOS</option>
                  {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
            </div>
            <div className="audit-filters-row">
              <div className="audit-filter">
                <label>Fecha desde</label>
                <input type="date" name="fechaDesde" placeholder="dd/mm/aaaa" style={inputStyle} value={filtros.fechaDesde} onChange={handleFiltroChange} />
              </div>
              <div className="audit-filter">
                <label>Fecha hasta</label>
                <input type="date" name="fechaHasta" placeholder="dd/mm/aaaa" style={inputStyle} value={filtros.fechaHasta} onChange={handleFiltroChange} />
              </div>
              <div className="audit-filter audit-filter-period">
                <label>Período rápido</label>
                <div className="audit-period-btns">
                  <button type="button">HOY</button>
                  <button type="button">AYER</button>
                  <button type="button">ÚLTIMOS 7 DÍAS</button>
                  <button type="button">ÚLTIMOS 30 DÍAS</button>
                  <button type="button">ESTE MES</button>
                </div>
              </div>
            </div>
            <div className="audit-filters-row">
              <div className="audit-filter">
                <label>Acción</label>
                <select style={inputStyle} name="accion" value={filtros.accion} onChange={handleFiltroChange}>
                  <option value="">TODAS</option>
                  {acciones.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.items.map((item) => (<option key={item} value={item}>{item}</option>))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="audit-filter">
                <label>Módulo</label>
                <select style={inputStyle} name="modulo" value={filtros.modulo} onChange={handleFiltroChange}>
                  <option value="">TODOS</option>
                  {modulos.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
            </div>
            <div className="audit-filters-row">
              <div className="audit-filter">
                <label>Resultado</label>
                <select style={inputStyle} name="resultado" value={filtros.resultado} onChange={handleFiltroChange}>
                  <option value="">TODOS</option>
                  {resultados.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
              <div className="audit-filter">
                <label>IP</label>
                <input type="text" name="ip" placeholder="Ej: 192.168.1.45" style={inputStyle} value={filtros.ip} onChange={handleFiltroChange} />
              </div>
            </div>
            <div className="audit-filters-row">
              <div className="audit-filter audit-filter-wide">
                <label>Búsqueda por término</label>
                <input type="text" name="termino" placeholder="Buscar en detalles... (ej: nombre paciente, ID tratamiento, factura, etc.)" style={inputStyle} value={filtros.termino} onChange={handleFiltroChange} />
              </div>
            </div>
            <div className="audit-filters-actions">
              <button className="audit-btn-primary" type="button" onClick={handleBuscar}>BUSCAR</button>
              <button className="audit-btn-secondary" type="button" onClick={handleLimpiarFiltros}>LIMPIAR FILTROS</button>
              <div className="audit-btn-export">
                <button type="button">EXPORTAR ▼</button>
                <div className="audit-export-dropdown">
                  <button type="button" onClick={exportarCSV}>Exportar a CSV</button>
                  <button type="button" onClick={exportarPDF}>Exportar a PDF</button>
                </div>
              </div>
            </div>
          </div>
          {/* Tabla de resultados de auditoría (estructura vacía) */}
          <div className="audit-table-section">
            <div className="audit-table-header">
              <span className="audit-table-title">RESULTADOS DE AUDITORÍA</span>
              <span className="audit-table-info">Mostrando 0-0 de 0 registros</span>
              <div className="audit-table-page-controls">
                <button>{"|<"}</button>
                <button>{"<"}</button>
                <span>1</span>
                <button>{">"}</button>
                <button>{">|"}</button>
                <select>
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                  <option>200</option>
                  <option>500</option>
                </select>
                <span>registros por página</span>
              </div>
            </div>
            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Acción</th>
                    <th>Módulo</th>
                    <th>Detalle</th>
                    <th>IP</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadosFiltrados.map((ev, idx) => (
                    <tr key={idx}>
                      <td>{ev.fecha}</td>
                      <td>{ev.usuario}</td>
                      <td>{ev.rol}</td>
                      <td>{ev.accion}</td>
                      <td>{ev.modulo}</td>
                      <td>{ev.detalle}</td>
                      <td>{ev.ip}</td>
                      <td>
                        <button className="audit-action-btn" onClick={() => { setModalData(ev); setModalOpen(true); }}>Ver</button>
                        <button className="audit-action-btn">Copiar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Leyenda de roles */}
          <div className="audit-legend">
            <span>Admin</span>
            <span>Dentista</span>
            <span>Sistema</span>
          </div>
          {/* Modal de detalle de auditoría */}
          {modalOpen && (
            <div className="audit-modal-overlay">
              <div className="audit-modal">
                <div className="audit-modal-head">
                  <div className="audit-modal-title">DETALLE COMPLETO DEL EVENTO</div>
                  <div className="audit-modal-id">ID: &nbsp;</div>
                </div>
                <div className="audit-modal-body">
                  <div className="audit-modal-section">
                    <strong>Información general:</strong>
                    <ul>
                      <li>Fecha y hora: &nbsp;{modalData?.fecha || ''}</li>
                      <li>Usuario: &nbsp;{modalData?.usuario || ''}</li>
                      <li>IP: &nbsp;{modalData?.ip || ''}</li>
                      <li>Módulo: &nbsp;{modalData?.modulo || ''}</li>
                      <li>Acción: &nbsp;{modalData?.accion || ''}</li>
                      <li>Resultado: &nbsp;</li>
                    </ul>
                  </div>
                  <div className="audit-modal-section">
                    <strong>Detalle específico:</strong>
                    <div>{modalData?.detalle || ''}</div>
                  </div>
                  <div className="audit-modal-section">
                    <strong>Información adicional:</strong>
                    <ul>
                      <li>Paciente ID: &nbsp;</li>
                      <li>Fecha cita: &nbsp;</li>
                      <li>Doctor asignado: &nbsp;</li>
                      <li>Consultorio: &nbsp;</li>
                      <li>Estado: &nbsp;</li>
                    </ul>
                  </div>
                  <div className="audit-modal-section">
                    <strong>Datos técnicos:</strong>
                    <details>
                      <summary>Ver metadatos completos (JSON)</summary>
                      <pre style={{ background: '#f7f7f7', padding: 10, borderRadius: 6 }}>{JSON.stringify(modalData, null, 2)}</pre>
                    </details>
                  </div>
                </div>
                <div className="audit-modal-actions">
                  <button className="audit-modal-btn" onClick={handleVerEventosSimilares}>VER EVENTOS SIMILARES</button>
                  <button className="audit-modal-btn" onClick={handleBuscarPorIP}>BUSCAR POR ESTA IP</button>
                  <button className="audit-modal-btn" onClick={handleVerActividadUsuario}>VER ACTIVIDAD DEL USUARIO</button>
                  <button className="audit-modal-btn audit-modal-btn-close" onClick={() => setModalOpen(false)}>CERRAR</button>
                </div>
              </div>
            </div>
          )}
          {/* Botón VER LÍNEA DE TIEMPO principal */}
          <div style={{ marginTop: 16 }}>
            <button className="audit-btn-timeline" type="button" onClick={() => setTimelineOpen(true)}>VER LÍNEA DE TIEMPO</button>
          </div>
          {/* Vista de línea de tiempo */}
          {timelineOpen && (
            <div className="audit-timeline-section" style={{ background: '#f7f8ff', borderRadius: '18px', padding: '24px', margin: '24px 0', boxShadow: '0 2px 16px rgba(23,96,74,0.06)' }}>
              <div className="audit-timeline-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#17604a' }}>Línea de tiempo de actividad - <span style={{ color: '#d42674' }}>Dr. Juan Pérez (jperez)</span></div>
                  <div style={{ marginTop: '6px', fontSize: '1rem', color: '#34495e' }}>
                    <span>Desde:</span> <input type="date" value="2026-02-01" style={{ marginRight: '8px', borderRadius: '8px', border: '1px solid #ccd6e0', padding: '4px 10px' }} />
                    <span>Hasta:</span> <input type="date" style={{ marginRight: '18px', borderRadius: '8px', border: '1px solid #ccd6e0', padding: '4px 10px' }} />
                    <button className="audit-period-btn" style={{ marginRight: '6px' }}>HOY</button>
                    <button className="audit-period-btn" style={{ marginRight: '6px' }}>ÚLTIMOS 7 DÍAS</button>
                    <button className="audit-period-btn">ESTE MES</button>
                  </div>
                </div>
                <button className="audit-btn-secondary" style={{ fontWeight: 'bold', fontSize: '1rem', padding: '10px 24px', borderRadius: '12px' }} onClick={() => setTimelineOpen(false)}>VOLVER A TABLA</button>
              </div>
              <div className="audit-timeline-graph" style={{ margin: '24px 0', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '18px' }}>
                {/* Gráfica tipo línea simulada */}
                <svg width="100%" height="120" viewBox="0 0 400 120">
                  <polyline points="20,100 60,80 100,90 140,70 180,90 220,80 260,100" fill="none" stroke="#17604a" strokeWidth="3" />
                  {/* Ejes y etiquetas */}
                  <line x1="20" y1="100" x2="260" y2="100" stroke="#bbb" strokeWidth="2" />
                  <line x1="20" y1="100" x2="20" y2="20" stroke="#bbb" strokeWidth="2" />
                  <text x="20" y="115" fontSize="13" fill="#888">01/02</text>
                  <text x="60" y="115" fontSize="13" fill="#888">07/02</text>
                  <text x="100" y="115" fontSize="13" fill="#888">14/02</text>
                  <text x="140" y="115" fontSize="13" fill="#888">21/02</text>
                  <text x="180" y="115" fontSize="13" fill="#888">28/02</text>
                </svg>
              </div>
              {/* Tabla de eventos y controles de paginación */}
              <div className="audit-timeline-events">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Acción</th>
                      <th>Módulo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineEvents.map((ev, idx) => (
                      <tr key={idx}>
                        <td>{ev.fecha}</td>
                        <td>{ev.hora}</td>
                        <td>{ev.accion}</td>
                        <td>{ev.modulo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="audit-table-page-controls">
                  <button>{"|<"}</button>
                  <button>{"<"}</button>
                  <span>1</span>
                  <button>{">"}</button>
                  <button>{">|"}</button>
                </div>
                <div className="audit-timeline-update">Última actualización: 21/02/2026 11:30 AM</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
