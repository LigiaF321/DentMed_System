import React, { useEffect, useState } from "react";
import "./MonitoringScreen.css";
import { exportToCSV, exportToPDF } from "../../services/exportService";

const API_BASE = "/api/admin/monitoring";

// función de impresión simple
function handlePrint(data) {
  if (!data || data.length === 0) {
    alert("No hay datos para imprimir");
    return;
  }

  let html = `<html><head><meta charset="UTF-8"><title>Registro de Actividades</title><style>body{font-family:Arial;margin:20px;}h1{color:#1a5f3f;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:12px;text-align:left;}th{background:#1a5f3f;color:#fff;}tr:nth-child(even){background:#f5f5f5;}</style></head><body><h1>Registro de Actividades del Sistema</h1><p>Generado: ${new Date().toLocaleString("es-ES")}</p><table><thead><tr><th>Fecha y Hora</th><th>Usuario</th><th>Acción</th><th>IP</th></tr></thead><tbody>`;

  data.forEach((row) => {
    html += `<tr><td>${new Date(row.fecha_hora).toLocaleString("es-ES")}</td><td>${row.Usuario?.nombre_completo||"Sistema"}</td><td>${row.accion}</td><td>${row.ip||"N/A"}</td></tr>`;
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
  const [paginacion, setPaginacion] = useState({ pagina: 1, por_pagina: 10, total: 0, total_paginas: 0 });

  // columnas para exportación
  const exportColumns = [
    { key: (r) => new Date(r.fecha_hora).toLocaleString("es-ES"), header: "Fecha y Hora" },
    { key: (r) => r.Usuario?.nombre_completo || "Sistema", header: "Usuario" },
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
      const resUsuarios = await fetch(`${API_BASE}/usuarios`);
      if (resUsuarios.ok) {
        const data = await resUsuarios.json();
        setUsuarios(data.usuarios || []);
      }

      // Cargar actividades
      await cargarActividades(1);

      // Cargar alertas
      const resAlertas = await fetch(`${API_BASE}/security-alerts`);
      if (resAlertas.ok) {
        const data = await resAlertas.json();
        setAlertas(data.alertas || []);
      }

      // Cargar estadísticas por hora
      const resHoras = await fetch(`${API_BASE}/hourly-stats`);
      if (resHoras.ok) {
        const data = await resHoras.json();
        setEstadisticasHoras(data.stats || []);
      }

      // Cargar tiempos de sesión
      const resSessions = await fetch(`${API_BASE}/session-times`);
      if (resSessions.ok) {
        const data = await resSessions.json();
        setTiemposSession(data.datos || []);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setCargando(false);
    }
  };

  const cargarActividades = async (page) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(filtros.usuario !== "TODOS" && { usuario: filtros.usuario }),
        ...(filtros.fechaDesde && { fechaDesde: filtros.fechaDesde }),
        ...(filtros.fechaHasta && { fechaHasta: filtros.fechaHasta }),
        ...(filtros.accion !== "TODOS" && { accion: filtros.accion }),
      });

      const res = await fetch(`${API_BASE}/activities?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActividades(data.data || []);
        setPaginacion(data.paginacion);
      }
    } catch (err) {
      console.error("Error cargando actividades:", err);
    }
  };

  const handleBuscar = () => {
    setPaginacion((p) => ({ ...p, pagina: 1 }));
    cargarActividades(1);
  };

  const handleLimpiar = () => {
    setFiltros({
      usuario: "TODOS",
      fechaDesde: "",
      fechaHasta: "",
      accion: "TODOS",
    });
    setPaginacion((p) => ({ ...p, pagina: 1 }));
    cargarActividades(1);
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

  return (
    <div className="monitoring-container">
      <h1>Monitoreo del Sistema</h1>

      {/* FILTROS DE BÚSQUEDA */}
      <section className="monitoring-section">
        <h2>Filtros de Búsqueda</h2>
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
              🔍 Buscar
            </button>
            <button className="btn-limpiar" onClick={handleLimpiar}>
              ✖️ Limpiar
            </button>
          </div>
        </div>
      </section>

      {/* ALERTAS DE SEGURIDAD */}
      {alertas.length > 0 && (
        <section className="monitoring-section alertas-section">
          <h2>⚠️ Alertas de Seguridad Detectadas</h2>
          <div className="alertas-content">
            {alertas.map((alerta, idx) => (
              <div key={idx} className="alerta-item">
                <strong>IP: {alerta.ip}</strong>
                <p>{alerta.intentos} intentos en los últimos 15 minutos</p>
                <small>Último intento: {formatearFecha(alerta.ultimoIntento)}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ACTIVIDAD POR HORAS */}
      <section className="monitoring-section">
        <h2>Actividad por Horas del Día</h2>
        <div className="grafico-container">
          <div className="grafico-barras">
            {estadisticasHoras.map((stat) => (
              <div key={stat.hora} className="barra-item">
                <div
                  className="barra"
                  style={{
                    height: `${Math.min(stat.cantidad * 5, 200)}px`,
                  }}
                  title={`${stat.cantidad} actividades`}
                />
                <span className="hora-label">{stat.hora}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIEMPO PROMEDIO DE SESIÓN */}
      <section className="monitoring-section">
        <h2>Tiempo Promedio de Sesión</h2>
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
            {tiemposSession.map((session) => (
              <tr key={session.id}>
                <td>{session.usuario}</td>
                <td>{formatearTiempo(session.tiempoPromedio)}</td>
                <td>{session.sesiones}</td>
                <td>{session.ultimoAcceso ? formatearFecha(session.ultimoAcceso) : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* REGISTRO DE ACTIVIDADES */}
      <section className="monitoring-section">
        <h2>Registro de Actividades</h2>
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
                    <td>{act.Usuario?.nombre_completo || "Sistema"}</td>
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
            Mostrando {actividades.length > 0 ? (paginacion.pagina - 1) * paginacion.por_pagina + 1 : 0}-
            {Math.min(paginacion.pagina * paginacion.por_pagina, paginacion.total)} de {paginacion.total}{" "}
            registros
          </span>

          <div className="botones-paginacion">
            <button
              disabled={paginacion.pagina === 1}
              onClick={() => cargarActividades(paginacion.pagina - 1)}
            >
              {"<"}
            </button>

            {Array.from({ length: Math.min(5, paginacion.total_paginas) }).map((_, i) => {
              const pagina = i + 1;
              return (
                <button
                  key={pagina}
                  className={paginacion.pagina === pagina ? "activo" : ""}
                  onClick={() => cargarActividades(pagina)}
                >
                  {pagina}
                </button>
              );
            })}

            <button
              disabled={paginacion.pagina === paginacion.total_paginas}
              onClick={() => cargarActividades(paginacion.pagina + 1)}
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
            📥 Exportar a CSV
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
            📄 Exportar a PDF
          </button>
          <button 
            className="btn-export"
            onClick={() => handlePrint(actividades)}
          >
            🖨️ Imprimir
          </button>
        </div>
      </section>
    </div>
  );
}
