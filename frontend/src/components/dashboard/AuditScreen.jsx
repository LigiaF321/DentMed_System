import React, { useState, useEffect, useMemo } from "react";
import "./AuditScreen.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { getAuditRecords, getAuditUsers } from "../../services/admin.service";

export default function AuditScreen() {

  const [usuarios, setUsuarios] = useState([]);
  const [registros, setRegistros] = useState([]);

  // Utilidades de fecha
  function formatDateInput(date) {
    // yyyy-MM-ddTHH:mm para input type="datetime-local"
    return date.toISOString().slice(0, 16);
  }

  function getTodayRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    return {
      desde: formatDateInput(start),
      hasta: formatDateInput(now)
    };
  }
  function getYesterdayRange() {
    const now = new Date();
    const ayer = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const finAyer = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 0);
    return {
      desde: formatDateInput(ayer),
      hasta: formatDateInput(finAyer)
    };
  }
  function getLastNDaysRange(n) {
    const now = new Date();
    const desde = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1), 0, 0, 0);
    return {
      desde: formatDateInput(desde),
      hasta: formatDateInput(now)
    };
  }
  function getThisMonthRange() {
    const now = new Date();
    const desde = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    return {
      desde: formatDateInput(desde),
      hasta: formatDateInput(now)
    };
  }

  // Estado inicial: últimos 7 días
  const [filtros, setFiltros] = useState(() => {
    const { desde, hasta } = getLastNDaysRange(7);
    return {
      usuario: "TODOS",
      rol: "TODOS",
      fechaDesde: desde,
      fechaHasta: hasta,
      accion: "TODAS",
      modulo: "TODOS",
      resultado: "TODOS",
      ip: "",
      busqueda: ""
    };
  });

  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [modal, setModal] = useState(null);
  const [vistaTimeline, setVistaTimeline] = useState(false);

  useEffect(() => {
    // Cargar usuarios reales para el filtro
    getAuditUsers()
      .then((users) => {
        setUsuarios(users || []);
      })
      .catch(() => setUsuarios([]));

    // Cargar registros reales de auditoría
    getAuditRecords()
      .then((data) => {
        setRegistros(Array.isArray(data) ? data : []);
      })
      .catch(() => setRegistros([]));
  }, []);

  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      const fechaValida =
        (!filtros.fechaDesde || new Date(r.fecha) >= new Date(filtros.fechaDesde)) &&
        (!filtros.fechaHasta || new Date(r.fecha) <= new Date(filtros.fechaHasta));

      return (
        (filtros.usuario === "TODOS" || r.usuario === filtros.usuario) &&
        (filtros.rol === "TODOS" || r.rol === filtros.rol) &&
        (filtros.accion === "TODAS" || r.accion === filtros.accion) &&
        (filtros.modulo === "TODOS" || r.modulo === filtros.modulo) &&
        (filtros.resultado === "TODOS" || r.resultado === filtros.resultado) &&
        fechaValida &&
        (!filtros.ip || r.ip.includes(filtros.ip)) &&
        (!filtros.busqueda ||
          (r.detalle && r.detalle.toLowerCase().includes(filtros.busqueda.toLowerCase())) ||
          (r.usuario && r.usuario.toLowerCase().includes(filtros.busqueda.toLowerCase())) ||
          (r.modulo && r.modulo.toLowerCase().includes(filtros.busqueda.toLowerCase())) ||
          (r.metadatos && JSON.stringify(r.metadatos).toLowerCase().includes(filtros.busqueda.toLowerCase()))
        )
      );
    });
  }, [registros, filtros]);

  const [orden, setOrden] = useState({ campo: "fecha", asc: false });

  const ordenar = (campo) => {
    setOrden(prev => ({ campo, asc: prev.campo === campo ? !prev.asc : true }));
  };

  const registrosOrdenados = useMemo(() => {
    return [...registrosFiltrados].sort((a, b) => {
      if (a[orden.campo] < b[orden.campo]) return orden.asc ? -1 : 1;
      if (a[orden.campo] > b[orden.campo]) return orden.asc ? 1 : -1;
      return 0;
    });
  }, [registrosFiltrados, orden]);

  const totalPaginas = Math.ceil(registrosOrdenados.length / porPagina);
  const datosPagina = registrosOrdenados.slice((pagina - 1) * porPagina, pagina * porPagina);

  // Exporta todos los datos filtrados, no solo la página
  const exportarPDF = () => {
    if (!registrosFiltrados.length) {
      return;
    }
    const doc = new jsPDF();
    doc.text("Reporte de Auditoría", 14, 15);
    const filas = registrosFiltrados.map(r => [
      new Date(r.fecha).toLocaleString(),
      r.usuario,
      r.accion,
      r.modulo,
      r.detalle,
      r.ip
    ]);
    doc.autoTable({
      head: [["Fecha", "Usuario", "Acción", "Módulo", "Detalle", "IP"]],
      body: filas
    });
    doc.save("auditoria.pdf");
    alert("¡PDF generado y descargado!");
    console.log("PDF exportado con", filas.length, "registros");
  };

  const timelineData = useMemo(() => {
    const mapa = {};
    registrosFiltrados.forEach(r => {
      const dia = new Date(r.fecha).toLocaleDateString();
      mapa[dia] = (mapa[dia] || 0) + 1;
    });

    return Object.keys(mapa).map(k => ({ fecha: k, cantidad: mapa[k] }));
  }, [registrosFiltrados]);

  return (

    <div className="dmh-page">
      <div className="dmh-header">
        <div>
          <div className="dmh-title">Auditoría y Consulta de Actividad</div>
        </div>
        <div className="audit-period-btns" style={{margin: '0 0 18px 0', display: 'flex', gap: 8}}>
          <button className="dmh-btn" style={{
            padding: '4px 10px',
            fontSize: '0.90rem',
            minWidth: 80,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #6a5af9, #d72660)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(106,90,249,0.10)',
            border: 'none'
          }} onClick={() => {
            const { desde, hasta } = getTodayRange();
            setFiltros(f => ({ ...f, fechaDesde: desde, fechaHasta: hasta }));
          }}>HOY</button>
          <button className="dmh-btn" style={{
            padding: '6px 18px',
            fontSize: '0.98rem',
            minWidth: 120,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #6a5af9, #d72660)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(106,90,249,0.10)',
            border: 'none'
          }} onClick={() => {
            const { desde, hasta } = getYesterdayRange();
            setFiltros(f => ({ ...f, fechaDesde: desde, fechaHasta: hasta }));
          }}>AYER</button>
          <button className="dmh-btn" style={{
            padding: '6px 18px',
            fontSize: '0.98rem',
            minWidth: 120,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #6a5af9, #d72660)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(106,90,249,0.10)',
            border: 'none'
          }} onClick={() => {
            const { desde, hasta } = getLastNDaysRange(7);
            setFiltros(f => ({ ...f, fechaDesde: desde, fechaHasta: hasta }));
          }}>ÚLTIMOS 7 DÍAS</button>
          <button className="dmh-btn" style={{
            padding: '6px 18px',
            fontSize: '0.98rem',
            minWidth: 120,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #6a5af9, #d72660)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(106,90,249,0.10)',
            border: 'none'
          }} onClick={() => {
            const { desde, hasta } = getLastNDaysRange(30);
            setFiltros(f => ({ ...f, fechaDesde: desde, fechaHasta: hasta }));
          }}>ÚLTIMOS 30 DÍAS</button>
          <button className="dmh-btn" style={{
            padding: '6px 18px',
            fontSize: '0.98rem',
            minWidth: 120,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #6a5af9, #d72660)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(106,90,249,0.10)',
            border: 'none'
          }} onClick={() => {
            const { desde, hasta } = getThisMonthRange();
            setFiltros(f => ({ ...f, fechaDesde: desde, fechaHasta: hasta }));
          }}>ESTE MES</button>
        </div>
      </div>

      <div className="audit-filters-panel" style={{marginBottom: 24, background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px rgba(23,96,74,0.06)', padding: '28px 28px 18px 28px'}}>
        <div className="audit-filters-row" style={{display: 'flex', flexWrap: 'wrap', gap: '28px 24px', marginBottom: 0}}>
          <div className="audit-filter" style={{minWidth: 180, flex: 1}}>
            <label style={{fontWeight: 700, color: '#1a2366', marginBottom: 4}}>Usuario:</label>
            <select style={{width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ccd6e0', fontSize: 15, background: '#f8fafc'}} value={filtros.usuario} onChange={(e)=>setFiltros({...filtros, usuario:e.target.value})}>
              <option value="TODOS">TODOS</option>
              {usuarios.map(u => (
                <option key={u.username} value={u.username}>{u.username}</option>
              ))}
            </select>
          </div>
          <div className="audit-filter" style={{minWidth: 180, flex: 1}}>
            <label style={{fontWeight: 700, color: '#1a2366', marginBottom: 4}}>Rol:</label>
            <select style={{width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ccd6e0', fontSize: 15, background: '#f8fafc'}} value={filtros.rol} onChange={(e)=>setFiltros({...filtros, rol:e.target.value})}>
              <option value="TODOS">TODOS</option>
              <option value="Admin">Admin</option>
              <option value="Dentista">Dentista</option>
            </select>
          </div>
          <div className="audit-filter" style={{minWidth: 180, flex: 1}}>
            <label style={{fontWeight: 700, color: '#1a2366', marginBottom: 4}}>Desde:</label>
            <input
              type="datetime-local"
              style={{width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ccd6e0', fontSize: 15, background: '#f8fafc'}}
              value={filtros.fechaDesde}
              onChange={e => {
                let value = e.target.value;
                // Validar que hasta >= desde
                if (filtros.fechaHasta && value > filtros.fechaHasta) {
                  setFiltros(f => ({ ...f, fechaDesde: value, fechaHasta: value }));
                } else {
                  setFiltros(f => ({ ...f, fechaDesde: value }));
                }
              }}
            />
          </div>

          <div className="audit-filter" style={{minWidth: 180, flex: 1}}>
            <label style={{fontWeight: 700, color: '#1a2366', marginBottom: 4}}>Hasta:</label>
            <input
              type="datetime-local"
              style={{width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ccd6e0', fontSize: 15, background: '#f8fafc'}}
              value={filtros.fechaHasta}
              min={filtros.fechaDesde}
              onChange={e => {
                let value = e.target.value;
                // Validar que hasta >= desde
                if (value < filtros.fechaDesde) {
                  setFiltros(f => ({ ...f, fechaHasta: filtros.fechaDesde }));
                } else {
                  setFiltros(f => ({ ...f, fechaHasta: value }));
                }
              }}
            />
          </div>
        </div>
        </div>
        <div style={{background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px rgba(23,96,74,0.06)', padding: '24px 24px 10px 24px', marginTop: 18, marginBottom: 18}}>
          <div style={{display: 'flex', justifyContent: 'flex-start', marginBottom: 12}}>
            <button className="dmh-btn audit-btn-export" style={{minWidth: 120, fontWeight: 700, fontSize: '0.98rem', background: 'linear-gradient(90deg, #6a5af9, #d72660)', color: '#fff', boxShadow: '0 2px 8px rgba(106,90,249,0.10)', border: 'none', marginRight: 12}} onClick={exportarPDF}>Exportar PDF</button>
            <button className="dmh-btn" style={{minWidth: 140, fontWeight: 700, fontSize: '0.98rem', background: 'linear-gradient(90deg, #6a5af9, #d72660)', color: '#fff', boxShadow: '0 2px 8px rgba(106,90,249,0.10)', border: 'none'}} onClick={() => window.location.reload()}>✖️ LIMPIAR</button>
          </div>
          <div className="audit-filters-row" style={{display: 'flex', gap: '18px', marginBottom: 0}}>
          <div className="audit-filter" style={{minWidth: 120, flex: 1}}>
            <label style={{fontWeight: 700, color: '#1a2366', marginBottom: 4}}>Acción:</label>
            <select style={{width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e3e7ef', fontSize: 14, background: '#f7faff'}} value={filtros.accion} onChange={(e)=>setFiltros({...filtros, accion:e.target.value})}>
              <option value="TODAS">TODAS</option>
              <optgroup label="SESIÓN">
                <option value="Inicio sesión">Inicio sesión</option>
                <option value="Cierre sesión">Cierre sesión</option>
                <option value="Intento fallido">Intento fallido</option>
              </optgroup>
              <optgroup label="CITAS">
                <option value="Crear cita">Crear cita</option>
                <option value="Editar cita">Editar cita</option>
                <option value="Cancelar cita">Cancelar cita</option>
                <option value="Ver cita">Ver cita</option>
              </optgroup>
              <optgroup label="DENTISTAS">
                <option value="Crear dentista">Crear dentista</option>
                <option value="Editar dentista">Editar dentista</option>
                <option value="Inhabilitar dentista">Inhabilitar dentista</option>
                <option value="Eliminar dentista">Eliminar dentista</option>
              </optgroup>
              <optgroup label="INSUMOS">
                <option value="Crear insumo">Crear insumo</option>
                <option value="Editar insumo">Editar insumo</option>
                <option value="Activar/Inactivar insumo">Activar/Inactivar insumo</option>
              </optgroup>
              <optgroup label="INVENTARIO">
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
                <option value="Ajuste">Ajuste</option>
              </optgroup>
              <optgroup label="CONFIGURACIÓN">
                <option value="Cambiar parámetros">Cambiar parámetros</option>
                <option value="Configurar horarios">Configurar horarios</option>
              </optgroup>
              <optgroup label="REPORTES">
                <option value="Generar reporte">Generar reporte</option>
                <option value="Exportar reporte">Exportar reporte</option>
              </optgroup>
              <optgroup label="SEGURIDAD">
                <option value="Alerta generada">Alerta generada</option>
                <option value="Alerta silenciada">Alerta silenciada</option>
                <option value="IP bloqueada">IP bloqueada</option>
              </optgroup>
            </select>
          </div>
          <div className="audit-filter" style={{minWidth: 120, flex: 1}}>
            <label style={{fontWeight: 700, color: '#1a2366', marginBottom: 4}}>Módulo:</label>
            <select style={{width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e3e7ef', fontSize: 14, background: '#f7faff'}} value={filtros.modulo} onChange={(e)=>setFiltros({...filtros, modulo:e.target.value})}>
              <option value="TODOS">TODOS</option>
              <option value="Login">Login</option>
              <option value="Dashboard">Dashboard</option>
              <option value="Dentistas">Dentistas</option>
              <option value="Citas">Citas</option>
              <option value="Pacientes">Pacientes</option>
              <option value="Inventario">Inventario</option>
              <option value="Insumos">Insumos</option>
              <option value="Reportes">Reportes</option>
              <option value="Configuración">Configuración</option>
              <option value="Seguridad">Seguridad</option>
              <option value="Auditoría">Auditoría</option>
            </select>
          </div>
          <div className="audit-filter" style={{minWidth: 120, flex: 1}}>
            <label style={{fontWeight: 700, color: '#1a2366', marginBottom: 4}}>Resultado:</label>
            <select style={{width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e3e7ef', fontSize: 14, background: '#f7faff'}} value={filtros.resultado} onChange={(e)=>setFiltros({...filtros, resultado:e.target.value})}>
              <option value="TODOS">TODOS</option>
              <option value="Exito">Éxito</option>
              <option value="Fallido">Fallido</option>
              <option value="Bloqueado">Bloqueado</option>
              <option value="Advertencia">Advertencia</option>
            </select>
          </div>
          <div className="audit-filter" style={{minWidth: 100, flex: 1}}>
            <label style={{fontWeight: 700, color: '#1a2366', marginBottom: 4}}>IP:</label>
            <input placeholder="Ej: 192.168.1.45" style={{width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e3e7ef', fontSize: 14, background: '#f7faff'}} value={filtros.ip} onChange={(e)=>setFiltros({...filtros, ip:e.target.value})} />
          </div>
          <div className="audit-filter audit-filter-wide" style={{minWidth: 220, flex: 2}}>
            <label style={{fontWeight: 700, color: '#1a2366', marginBottom: 4}}>Búsqueda general:</label>
            <input placeholder=" Buscar en detalles... (ej: nombre paciente, ID tratamiento, factura, etc.)" style={{width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e3e7ef', fontSize: 14, background: '#f7faff'}} value={filtros.busqueda} onChange={(e)=>setFiltros({...filtros, busqueda:e.target.value})} />
          </div>
          </div>
        </div>

      {/* Fin de filtros y botones rápidos */}

      {!vistaTimeline && (
        <div className="dmh-card audit-table-section" style={{marginTop: 24, padding: 0}}>
          <div className="audit-table-wrap" style={{padding: 18}}>
            <table className="dmh-table" style={{width: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
              <thead>
                <tr className="dmh-thead" style={{background: 'rgba(79,70,229,0.07)'}}>
                  <th style={{padding: '10px 8px', borderRadius: '10px 0 0 0'}} onClick={()=>ordenar("fecha")}>Fecha</th>
                  <th style={{padding: '10px 8px'}} onClick={()=>ordenar("usuario")}>Usuario</th>
                  <th style={{padding: '10px 8px'}}>Rol</th>
                  <th style={{padding: '10px 8px'}} onClick={()=>ordenar("accion")}>Acción</th>
                  <th style={{padding: '10px 8px'}}>Módulo</th>
                  <th style={{padding: '10px 8px'}}>Detalle</th>
                  <th style={{padding: '10px 8px'}}>IP</th>
                  <th style={{padding: '10px 8px', borderRadius: '0 10px 0 0'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datosPagina.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{textAlign: 'center', padding: 32, color: '#888'}}>Sin registros</td>
                  </tr>
                ) : (
                  datosPagina.map(r => (
                    <tr className="dmh-trow" key={r.id} style={{background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(79,70,229,0.07)'}}>
                      <td>{new Date(r.fecha).toLocaleString()}</td>
                      <td style={{cursor:'pointer', color:'var(--dmh-indigo)', fontWeight: 600}} onClick={()=>setFiltros({...filtros, usuario:r.usuario})}>{r.usuario}</td>
                      <td>{r.rol}</td>
                      <td>{r.accion}</td>
                      <td>{r.modulo}</td>
                      <td>{r.detalle}</td>
                      <td style={{cursor:'pointer', color:'var(--dmh-pink)', fontWeight: 600}} onClick={()=>setFiltros({...filtros, ip:r.ip})}>{r.ip}</td>
                      <td>
                        <button className="dmh-btn" style={{padding: '6px 18px', fontSize: '0.98rem'}} onClick={()=>setModal(r)}>Ver</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{display: 'flex', gap: '18px', margin: '18px 0 0 0', justifyContent: 'flex-end'}}>
            <button className="dmh-btn audit-btn-timeline" style={{minWidth: 180, fontWeight: 700, fontSize: '1.05rem', background: 'linear-gradient(90deg, var(--dmh-ok), var(--dmh-indigo))', color: '#fff', boxShadow: '0 2px 8px rgba(23,96,74,0.10)', border: 'none'}} onClick={()=>setVistaTimeline(true)}>Ver línea de tiempo</button>
          </div>
        </div>
      )}

      {!vistaTimeline && (
        <div style={{marginTop: 18, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18}}>
          <button className="dmh-btn" style={{minWidth: 110}} disabled={pagina===1} onClick={()=>setPagina(pagina-1)}>Anterior</button>
          <span style={{fontWeight: 700, fontSize: '1.1rem'}}>{pagina} / {totalPaginas}</span>
          <button className="dmh-btn" style={{minWidth: 110}} disabled={pagina===totalPaginas} onClick={()=>setPagina(pagina+1)}>Siguiente</button>
        </div>
      )}

      {modal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Detalle</h2>
            <p>{modal.detalle}</p>
            <button onClick={()=>setVistaTimeline(true)}>Ver actividad</button>
            <button onClick={()=>setModal(null)}>Cerrar</button>
          </div>
        </div>
      )}



      {vistaTimeline && (
        <div className="dmh-card" style={{marginTop: 24, padding: '24px 24px 10px 24px', borderRadius: 18, boxShadow: '0 2px 16px rgba(23,96,74,0.06)', background: '#fff'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18}}>
            <h2 style={{margin: 0, color: '#1a2366', fontWeight: 800, fontSize: '2.1rem'}}>Linea de tiempo</h2>
            <button
              className="dmh-btn"
              style={{
                minWidth: 120,
                fontWeight: 700,
                fontSize: '0.98rem',
                background: 'linear-gradient(90deg, #6a5af9, #d72660)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(106,90,249,0.10)',
                border: 'none',
              }}
              onClick={() => setVistaTimeline(false)}
            >Volver</button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cantidad" stroke="#000" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
