import React, { useEffect, useState } from "react";
import "./MonitoringScreen.css";
import { exportToCSV, exportToPDF } from "../../services/exportService";

const API_BASE = "/api/admin/monitoring";
const DEFAULT_PAGINACION = { pagina: 1, por_pagina: 10, total: 0, total_paginas: 0 };

function getNombreUsuario(registro) {
  return (
    registro?.Usuario?.nombre_completo ||
    registro?.usuario_nombre ||
    registro?.usuario ||
    "Sistema"
  );
}

function normalizarPaginacion(payload, page = 1, limit = 10) {
  const origen = payload?.paginacion || payload?.pagination || payload || {};
  const total = Number(origen.total || 0) || 0;
  const porPagina = Number(origen.por_pagina || origen.limit || limit) || limit;
  const pagina = Number(origen.pagina || origen.page || page) || page;
  const totalPaginas =
    Number(origen.total_paginas || origen.totalPages || 0) ||
    (total > 0 ? Math.ceil(total / porPagina) : 0);

  return {
    pagina,
    por_pagina: porPagina,
    total,
    total_paginas: totalPaginas,
  };
}

function normalizarUsuarios(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.usuarios)) return payload.usuarios;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizarSesiones(payload) {
  const sesiones = Array.isArray(payload) ? payload : payload?.datos || payload?.data || [];

  return sesiones.map((session, index) => ({
    id: session.id || session.usuario_id || `${session.usuario_nombre || session.usuario || "sesion"}-${index}`,
    usuario: session.usuario || session.usuario_nombre || "Sistema",
    tiempoPromedio:
      session.tiempoPromedio ??
      session.duracion_promedio ??
      session.duracion_minutos ??
      0,
    sesiones: session.sesiones ?? session.total_sesiones ?? 1,
    ultimoAcceso: session.ultimoAcceso || session.ultimo_acceso || session.fin || session.fecha_hora || null,
  }));
}

async function fetchJson(paths) {
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Error consultando ${path}:`, error);
    }
  }

  return null;
}

// función de impresión simple
function handlePrint(data) {
  if (!data || data.length === 0) {
    alert("No hay datos para imprimir");
    return;
  }

  let html = `<html><head><meta charset="UTF-8"><title>Registro de Actividades</title><style>body{font-family:Arial;margin:20px;}h1{color:#1a5f3f;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:12px;text-align:left;}th{background:#1a5f3f;color:#fff;}tr:nth-child(even){background:#f5f5f5;}</style></head><body><h1>Registro de Actividades del Sistema</h1><p>Generado: ${new Date().toLocaleString("es-ES")}</p><table><thead><tr><th>Fecha y Hora</th><th>Usuario</th><th>Acción</th><th>IP</th></tr></thead><tbody>`;

  data.forEach((row) => {
    html += `<tr><td>${new Date(row.fecha_hora).toLocaleString("es-ES")}</td><td>${getNombreUsuario(row)}</td><td>${row.accion}</td><td>${row.ip||"N/A"}</td></tr>`;
  });

  html += `</tbody></table></body></html>`;

  const printWindow = window.open("","","height=600,width=800");
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
}

export default function MonitoringScreen() {
  const [filtros, setFiltros] = useState({
    usuario: "TODOS",
    fechaDesde: "",
    fechaHasta: "",
    accion: "TODOS",
  });

  const [actividades, setActividades] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [estadisticasHoras, setEstadisticasHoras] = useState([]);
  const [tiemposSession, setTiemposSession] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [paginacion, setPaginacion] = useState(DEFAULT_PAGINACION);

  // columnas para exportación
  const exportColumns = [
    { key: (r) => new Date(r.fecha_hora).toLocaleString("es-ES"), header: "Fecha y Hora" },
    { key: (r) => getNombreUsuario(r), header: "Usuario" },
    { key: "accion", header: "Acción" },
    { key: "ip", header: "IP" },
  ];

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // Cargar usuarios para el filtro
      const dataUsuarios = await fetchJson([`${API_BASE}/users`, `${API_BASE}/usuarios`]);
      setUsuarios(normalizarUsuarios(dataUsuarios));

      // Cargar actividades
      await cargarActividades(1);

      // Cargar alertas
      const dataAlertas = await fetchJson([`${API_BASE}/security-alerts`]);
      setAlertas(dataAlertas?.alertas || []);

      // Cargar estadísticas por hora
      const dataHoras = await fetchJson([`${API_BASE}/hourly-stats`]);
      setEstadisticasHoras(dataHoras?.stats || []);

      // Cargar tiempos de sesión
      const dataSesiones = await fetchJson([`${API_BASE}/session-times`]);
      setTiemposSession(normalizarSesiones(dataSesiones));
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setCargando(false);
    }
  };

  const cargarActividades = async (page, filtrosActuales = filtros) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(filtrosActuales.usuario !== "TODOS" && { usuario: filtrosActuales.usuario }),
        ...(filtrosActuales.fechaDesde && { fechaDesde: filtrosActuales.fechaDesde }),
        ...(filtrosActuales.fechaHasta && { fechaHasta: filtrosActuales.fechaHasta }),
        ...(filtrosActuales.accion !== "TODOS" && { accion: filtrosActuales.accion }),
      });

      const res = await fetch(`${API_BASE}/activities?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActividades(data.data || []);
        setPaginacion(normalizarPaginacion(data, page, 10));
        return;
      }

      setActividades([]);
      setPaginacion(normalizarPaginacion(null, page, 10));
    } catch (err) {
      console.error("Error cargando actividades:", err);
      setActividades([]);
      setPaginacion(normalizarPaginacion(null, page, 10));
    }
  };

  const handleBuscar = () => {
    setPaginacion((p) => ({ ...p, pagina: 1 }));
    cargarActividades(1, filtros);
  };

  const handleLimpiar = () => {
    const filtrosIniciales = {
      usuario: "TODOS",
      fechaDesde: "",
      fechaHasta: "",
      accion: "TODOS",
    };

    setFiltros(filtrosIniciales);
    setPaginacion((p) => ({ ...p, pagina: 1 }));
    cargarActividades(1, filtrosIniciales);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-ES");
  };

  const formatearTiempo = (minutos) => {
    if (minutos < 60) return `${Math.round(minutos)} minutos`;
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return `${horas}h ${mins}m`;
  };

  if (cargando) {
    return <div className="monitoring-loading">Cargando datos...</div>;
  }

  const paginaActual = paginacion?.pagina || DEFAULT_PAGINACION.pagina;
  const registrosPorPagina = paginacion?.por_pagina || DEFAULT_PAGINACION.por_pagina;
  const totalRegistros = paginacion?.total || DEFAULT_PAGINACION.total;
  const totalPaginas = paginacion?.total_paginas || DEFAULT_PAGINACION.total_paginas;
  const promedioGeneralSesion =
    tiemposSession.length > 0
      ? tiemposSession.reduce((acc, session) => acc + Number(session.tiempoPromedio || 0), 0) /
        tiemposSession.length
      : 0;

  return (
    <div className="dm2-page monitoring-page">
      <section className="monitoring-hero">
        <div>
          <div className="monitoring-hero__eyebrow">Centro de supervisión</div>
          <h1>Monitoreo del Sistema</h1>
          <p>
            Consulta actividad reciente, sesiones y eventos operativos desde una sola vista.
          </p>
        </div>
      </section>

      <section className="monitoring-kpis">
        <article className="monitoring-kpi monitoring-kpi--emerald">
          <span className="monitoring-kpi__icon"><i className="fa-solid fa-clock-rotate-left" /></span>
          <div>
            <strong>{totalRegistros}</strong>
            <small>Actividades registradas</small>
          </div>
        </article>

        <article className="monitoring-kpi monitoring-kpi--blue">
          <span className="monitoring-kpi__icon"><i className="fa-solid fa-users" /></span>
          <div>
            <strong>{usuarios.length}</strong>
            <small>Usuarios listados</small>
          </div>
        </article>

        <article className="monitoring-kpi monitoring-kpi--amber">
          <span className="monitoring-kpi__icon"><i className="fa-solid fa-triangle-exclamation" /></span>
          <div>
            <strong>{alertas.length}</strong>
            <small>Alertas detectadas</small>
          </div>
        </article>

        <article className="monitoring-kpi monitoring-kpi--violet">
          <span className="monitoring-kpi__icon"><i className="fa-solid fa-stopwatch" /></span>
          <div>
            <strong>{formatearTiempo(promedioGeneralSesion)}</strong>
            <small>Promedio general de sesión</small>
          </div>
        </article>
      </section>

      {/* FILTROS DE BÚSQUEDA */}
      <section className="dm2-card monitoring-section monitoring-section--filters">
        <div className="dm2-card-head">
          <div className="dm2-card-title">Filtros de Búsqueda</div>
          <div className="monitoring-cardHint">Refina por usuario, fecha o tipo de acción</div>
        </div>
        <div className="dm2-card-body">
        <div className="filtros-content">
          <div className="filtro-grupo">
            <label>Usuario:</label>
            <select
              value={filtros.usuario}
              onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
            >
              <option value="TODOS">TODOS</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Fecha desde:</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
            />
          </div>

          <div className="filtro-grupo">
            <label>Fecha hasta:</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
            />
          </div>

          <div className="filtro-grupo">
            <label>Tipo de acción:</label>
            <select
              value={filtros.accion}
              onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
            >
              <option value="TODOS">TODOS</option>
              <option value="Inicio de sesión">Inicio de sesión</option>
              <option value="Cierre de sesión">Cierre de sesión</option>
              <option value="fallido">Intentos fallidos</option>
            </select>
          </div>

          <div className="filtro-botones">
            <button className="btn-buscar" onClick={handleBuscar}>
              <i className="fa-solid fa-magnifying-glass" /> Buscar
            </button>
            <button className="btn-limpiar" onClick={handleLimpiar}>
              <i className="fa-solid fa-eraser" /> Limpiar
            </button>
          </div>
        </div>
        </div>
      </section>

      {/* ALERTAS DE SEGURIDAD */}
      {alertas.length > 0 && (
        <section className="dm2-card monitoring-section alertas-section">
          <div className="dm2-card-head">
            <div className="dm2-card-title">Alertas de Seguridad Detectadas</div>
            <div className="monitoring-cardHint">Actividad anómala reciente</div>
          </div>
          <div className="dm2-card-body alertas-content">
            {alertas.map((alerta, idx) => (
              <div key={idx} className="alerta-item">
                <strong>IP: {alerta.ip}</strong>
                <p>{alerta.intentos} intentos en los últimos 15 minutos</p>
                <small>Último intento: {formatearFecha(alerta.ultimoIntento || alerta.fecha_hora)}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ACTIVIDAD POR HORAS */}
      <section className="dm2-card monitoring-section">
        <div className="dm2-card-head">
          <div className="dm2-card-title">Actividad por Horas del Día</div>
          <div className="monitoring-cardHint">Distribución de eventos por franja horaria</div>
        </div>
        <div className="dm2-card-body">
          <div className="grafico-container">
            {estadisticasHoras.length > 0 ? (
              <div className="grafico-barras">
                {estadisticasHoras.map((stat) => (
                  <div key={stat.hora} className="barra-item">
                    <span className="barra-valor">{stat.cantidad}</span>
                    <div
                      className="barra"
                      style={{
                        height: `${Math.max(Math.min(stat.cantidad * 5, 200), 16)}px`,
                      }}
                      title={`${stat.cantidad} actividades`}
                    />
                    <span className="hora-label">{stat.hora}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="monitoring-emptyState">
                <i className="fa-regular fa-chart-bar" />
                <span>No hay estadísticas por hora disponibles todavía.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TIEMPO PROMEDIO DE SESIÓN */}
      <section className="dm2-card monitoring-section">
        <div className="dm2-card-head">
          <div className="dm2-card-title">Tiempo Promedio de Sesión</div>
          <div className="monitoring-cardHint">Duración estimada por usuario</div>
        </div>
        <div className="dm2-card-body">
        <table className="tabla-sesiones">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Tiempo Promedio</th>
              <th>Sesiones</th>
              <th>Último Acceso</th>
            </tr>
          </thead>
          <tbody>
            {tiemposSession.length > 0 ? (
              tiemposSession.map((session) => (
                <tr key={session.id}>
                  <td>{session.usuario}</td>
                  <td>{formatearTiempo(session.tiempoPromedio)}</td>
                  <td>{session.sesiones}</td>
                  <td>{session.ultimoAcceso ? formatearFecha(session.ultimoAcceso) : "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="sin-datos">
                  No hay datos de sesiones para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </section>

      {/* REGISTRO DE ACTIVIDADES */}
      <section className="dm2-card monitoring-section">
        <div className="dm2-card-head">
          <div className="dm2-card-title">Registro de Actividades</div>
          <div className="monitoring-cardHint">Bitácora reciente del sistema</div>
        </div>
        <div className="dm2-card-body">
        <div className="tabla-container">
          <table className="tabla-actividades">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {actividades.length > 0 ? (
                actividades.map((act) => (
                  <tr key={act.id}>
                    <td>{formatearFecha(act.fecha_hora)}</td>
                    <td>{getNombreUsuario(act)}</td>
                    <td>{act.accion}</td>
                    <td>{act.ip || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="sin-datos">
                    Sin registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="paginacion">
          <span>
            Mostrando {actividades.length > 0 ? (paginaActual - 1) * registrosPorPagina + 1 : 0}-
            {Math.min(paginaActual * registrosPorPagina, totalRegistros)} de {totalRegistros}{" "}
            registros
          </span>

          <div className="botones-paginacion">
            <button
              disabled={paginaActual === 1}
              onClick={() => cargarActividades(paginaActual - 1)}
            >
              {"<"}
            </button>

            {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
              const pagina = i + 1;
              return (
                <button
                  key={pagina}
                  className={paginaActual === pagina ? "activo" : ""}
                  onClick={() => cargarActividades(pagina)}
                >
                  {pagina}
                </button>
              );
            })}

            <button
              disabled={totalPaginas === 0 || paginaActual === totalPaginas}
              onClick={() => cargarActividades(paginaActual + 1)}
            >
              {">"}
            </button>
          </div>
        </div>

        {/* BOTONES DE EXPORTACIÓN */}
        <div className="botones-exportar">
          <button 
            className="btn-export"
            onClick={() => exportToCSV(actividades, exportColumns, `actividades_${new Date().toISOString().split('T')[0]}.csv`)}
          >
            <i className="fa-solid fa-file-csv" /> Exportar a CSV
          </button>
          <button 
            className="btn-export"
            onClick={() =>
              exportToPDF(actividades, exportColumns, {
                title: "Registro de Actividades",
                filename: `actividades_${new Date().toISOString().split('T')[0]}.pdf`,
                orientation: "portrait",
                pageSize: "a4",
              })
            }
          >
            <i className="fa-solid fa-file-pdf" /> Exportar a PDF
          </button>
          <button 
            className="btn-export"
            onClick={() => handlePrint(actividades)}
          >
            <i className="fa-solid fa-print" /> Imprimir
          </button>
        </div>
        </div>
      </section>
    </div>
  );
}
