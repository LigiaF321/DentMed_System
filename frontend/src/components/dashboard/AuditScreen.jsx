import React from "react";
import "./AuditScreen.css";
import TimelineScreen from "./TimelineScreen";

export default function AuditScreen() {
        const [modalOpen, setModalOpen] = React.useState(false);
        const [modalData, setModalData] = React.useState(null);
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
      // Datos simulados de resultados
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
        // ...más resultados
      ];

  const handleExportCSV = () => {
    const separator = ";";
    const columns = ["Fecha y Hora", "Usuario", "Rol", "Acción", "Módulo", "Detalle", "IP"];
    const csvRows = [columns.join(separator)];
    auditResults.forEach(row => {
      csvRows.push([
        row.fecha,
        row.usuario,
        row.rol,
        row.accion,
        row.modulo,
        row.detalle,
        row.ip
      ].join(separator));
    });
    const csvContent = csvRows.join("\n");
    const now = new Date();
    const filename = `auditoria_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    // Ejemplo básico usando window.print (puedes mejorar con jsPDF o html2pdf)
    window.print();
  };

    // Abrir modal con datos simulados
    const handleOpenModal = () => {
      setModalData(exampleEvent);
      setModalOpen(true);
    };
    const handleCloseModal = () => {
      setModalOpen(false);
      setModalData(null);
    };
    // Abrir línea de tiempo desde botón
    const handleOpenTimeline = (usuario = "jperez", nombre = "Dr. Juan Pérez") => {
      setTimelineUser({ usuario, nombre });
      setTimelineOpen(true);
      setModalOpen(false);
    };
    const handleCloseTimeline = () => {
      setTimelineOpen(false);
    };
  // Valores simulados, luego se pueden conectar a datos reales
  const stats = [
    { label: "Total registros", value: "12,456", icon: "fa-clipboard-list" },
    { label: "Última semana", value: "1,234", icon: "fa-calendar-week" },
    { label: "Usuarios activos hoy", value: "8", icon: "fa-user-check" },
    { label: "Eventos críticos", value: "23", icon: "fa-exclamation-triangle" },
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

  // Estado de filtros
  // (En una versión real, se usaría useState para cada filtro)

  return (
    <div className="dm2-page">
      <div className="dm2-card">
        <div className="dm2-card-head">
          <div className="audit-header">
            <span className="audit-header-icon" role="img" aria-label="Auditoría">📋</span>
            <div className="audit-header-titles">
              <div className="audit-header-title">Auditoría y Consulta de Actividad</div>
              <div className="audit-header-subtitle">Registro histórico de todas las acciones realizadas en el sistema</div>
            </div>
          </div>
        </div>
        <div className="dm2-card-body">
          <div className="audit-table-responsive">
            <div className="audit-table-header">
              <span className="audit-table-title">Resultados de Auditoría</span>
              <span className="audit-table-info">Mostrando 1-5 de 12,456 registros (página 1 de 2)</span>
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
                    <th>Fecha y Hora <span className="audit-table-sort">▼</span></th>
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
                  {auditResults.map((ev, idx) => (
                    <tr key={idx}>
                      <td>{ev.fecha}</td>
                      <td title={ev.usuario} style={{ cursor: 'pointer', color: '#17604a' }} onClick={() => handleOpenTimeline(ev.usuario, ev.usuario)}>{ev.usuario}</td>
                      <td><span className="audit-role audit-role-dentista">{ev.rol === 'Dentista' ? '👨‍⚕️' : '🛡️'} {ev.rol}</span></td>
                      <td><span className="audit-action audit-action-create">{ev.accion === 'Crear cita' ? '🟢' : '⚙️'} {ev.accion}</span></td>
                      <td><span className="audit-module">{ev.modulo}</span></td>
                      <td>{ev.detalle}</td>
                      <td style={{ cursor: 'pointer', color: '#17604a' }}>{ev.ip}</td>
                      <td>
                        <button className="audit-action-btn" onClick={handleOpenModal}>👁️</button>
                        <button className="audit-action-btn">📋</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Modal de detalle de auditoría */}
          {modalOpen && modalData && (
            <div className="audit-modal-overlay">
              <div className="audit-modal">
                <div className="audit-modal-head">
                  <div className="audit-modal-title">Detalle completo del evento</div>
                  <div className="audit-modal-id">ID: {modalData.id}</div>
                </div>
                <div className="audit-modal-body">
                  <div className="audit-modal-section">
                    <strong>Fecha y hora:</strong> {modalData.fecha}
                  </div>
                  <div className="audit-modal-section">
                    <strong>Usuario:</strong> {modalData.usuario} <span style={{ color: '#888' }}>({modalData.nombreCompleto})</span>
                  </div>
                  <div className="audit-modal-section">
                    <strong>Rol:</strong> {modalData.rol}
                  </div>
                  <div className="audit-modal-section">
                    <strong>IP:</strong> {modalData.ip}
                  </div>
                  <div className="audit-modal-section">
                    <strong>Módulo:</strong> {modalData.modulo}
                  </div>
                  <div className="audit-modal-section">
                    <strong>Acción:</strong> {modalData.accion}
                  </div>
                  <div className="audit-modal-section">
                    <strong>Descripción:</strong> {modalData.descripcion}
                  </div>
                  <div className="audit-modal-section">
                    <strong>Información adicional:</strong>
                    <ul>
                      <li>Paciente ID: {modalData.infoAdicional.pacienteId}</li>
                      <li>Fecha cita: {modalData.infoAdicional.fechaCita}</li>
                      <li>Doctor asignado: {modalData.infoAdicional.doctor}</li>
                      <li>Consultorio: {modalData.infoAdicional.consultorio}</li>
                      <li>Estado: {modalData.infoAdicional.estado}</li>
                    </ul>
                  </div>
                  {/* Sección expandible de metadatos técnicos */}
                  <details className="audit-modal-section">
                    <summary>Ver datos técnicos (JSON)</summary>
                    <pre style={{ background: '#f7f7f7', padding: 10, borderRadius: 6 }}>{JSON.stringify(modalData.metadatos, null, 2)}</pre>
                  </details>
                </div>
                <div className="audit-modal-actions">
                  <button className="audit-modal-btn">📋 VER EVENTOS SIMILARES</button>
                  <button className="audit-modal-btn">🔍 BUSCAR POR ESTA IP</button>
                  <button className="audit-modal-btn" onClick={() => handleOpenTimeline(modalData.usuario, modalData.nombreCompleto)}>👤 VER ACTIVIDAD DEL USUARIO</button>
                  <button className="audit-modal-btn audit-modal-btn-close" onClick={handleCloseModal}>✖️ CERRAR</button>
                </div>
              </div>
            </div>
          )}
          {/* Botón VER LÍNEA DE TIEMPO principal */}
          <div style={{ marginTop: 16 }}>
            <button className="audit-btn-timeline" type="button" onClick={() => handleOpenTimeline("jperez", "Dr. Juan Pérez")}>📊 VER LÍNEA DE TIEMPO</button>
          </div>
          {/* Vista de línea de tiempo */}
          {timelineOpen && (
            <TimelineScreen usuario={timelineUser.usuario} nombre={timelineUser.nombre} onBack={handleCloseTimeline} />
          )}
          <div className="audit-filters-panel">
            {/* Primera fila */}
            <div className="audit-filters-row">
              <div className="audit-filter">
                <label>Usuario</label>
                <select>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} {u.nombre && `- ${u.nombre}`}
                    </option>
                  ))}
                </select>
                <input type="text" placeholder="Buscar usuario..." style={{ marginTop: 4 }} />
              </div>
              <div className="audit-filter">
                <label>Rol</label>
                <select>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Segunda fila */}
            <div className="audit-filters-row">
              <div className="audit-filter">
                <label>Fecha desde</label>
                <input type="datetime-local" />
              </div>
              <div className="audit-filter">
                <label>Fecha hasta</label>
                <input type="datetime-local" />
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
            {/* Tercera fila */}
            <div className="audit-filters-row">
              <div className="audit-filter">
                <label>Acción</label>
                <select>
                  <option value="all">TODAS</option>
                  {acciones.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.items.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="audit-filter">
                <label>Módulo</label>
                <select>
                  {modulos.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Cuarta fila */}
            <div className="audit-filters-row">
              <div className="audit-filter">
                <label>Resultado</label>
                <select>
                  {resultados.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="audit-filter">
                <label>IP</label>
                <input type="text" placeholder="Ej: 192.168.1.45" />
              </div>
            </div>
            {/* Quinta fila */}
            <div className="audit-filters-row">
              <div className="audit-filter audit-filter-wide">
                <label>Búsqueda por término</label>
                <input type="text" placeholder="🔍 Buscar en detalles... (ej: nombre paciente, ID tratamiento, factura, etc.)" />
              </div>
            </div>
            {/* Botones de acción */}
            <div className="audit-filters-actions">
              <button className="audit-btn-primary" type="button">🔍 BUSCAR</button>
              <button className="audit-btn-secondary" type="button">✖️ LIMPIAR</button>
              <div className="audit-btn-export">
                <button type="button">📥 EXPORTAR ▼</button>
                <div className="audit-export-dropdown">
                  <button type="button" onClick={handleExportCSV}>Exportar a CSV</button>
                  <button type="button" onClick={handleExportPDF}>Exportar a PDF</button>
                </div>
              </div>
              <button className="audit-btn-timeline" type="button" disabled>
                📊 VER LÍNEA DE TIEMPO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
