import React, { useState, useMemo, useEffect } from "react";
import { apiCall } from "../../services/api";


const MOCK_ALERTAS = [
  {
    id: 1,
    hora: "10:35",
    prioridad: "critica",
    tipo: "intentos_fallidos",
    detalle: "8 intentos fallidos desde IP 192.168.1.45 en 15 minutos. Usuarios: admin, doctor01, doctor05",
    estado: "activa",
    fecha: "2026-03-10"
  },
  {
    id: 2,
    hora: "02:15",
    prioridad: "critica",
    tipo: "acceso_fuera_horario",
    detalle: "Usuario doctor05 accedió el 21/02 a las 02:15 AM. Horario normal: 8:00 AM - 8:00 PM",
    estado: "activa",
    fecha: "2026-02-21"
  },
  {
    id: 3,
    hora: "09:20",
    prioridad: "advertencia",
    tipo: "cuenta_bloqueada",
    detalle: "Usuario carlos.d bloqueado por 5 intentos fallidos. Bloqueada hasta 22/02 09:20 AM",
    estado: "activa",
    fecha: "2026-02-22"
  },
  {
    id: 4,
    hora: "08:45",
    prioridad: "advertencia",
    tipo: "ip_sospechosa",
    detalle: "IP 10.0.0.87 con 3 intentos fallidos en 5 minutos. Usuarios: admin, admin2, root",
    estado: "activa",
    fecha: "2026-03-10"
  },
  {
    id: 5,
    hora: "07:30",
    prioridad: "advertencia",
    tipo: "cambio_clave_inusual",
    detalle: "Usuario maria.l realizó 2 cambios de contraseña en 1 hora",
    estado: "activa",
    fecha: "2026-03-10"
  },
  {
    id: 6,
    hora: "06:20",
    prioridad: "informativa",
    tipo: "nuevo_dispositivo",
    detalle: "Usuario ana.g accedió desde nuevo dispositivo. IP: 10.0.0.132, Navegador: Chrome 121, SO: Windows 11",
    estado: "activa",
    fecha: "2026-03-10"
  }
];

export default function AlertasSeguridadScreen() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    mostrar: "TODAS",
    prioridad: "TODAS",
    fechaDesde: "",
    fechaHasta: ""
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const alertasPorPagina = 10;

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSilenciarModal, setShowSilenciarModal] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [silenciarForm, setSilenciarForm] = useState({
    justificacion: "",
    duracion: "24"
  });

  useEffect(() => {
    cargarAlertas();


  }, []);

  const cargarAlertas = async () => {
    try {
      const response = await apiCall('/admin/seguridad/alertas');
      const alertasMapeadas = (response.alertas || []).map(alerta => ({
        id: alerta.id,
        hora: new Date(alerta.fecha_alerta).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        prioridad: alerta.prioridad,
        tipo: alerta.tipo_alerta,
        detalle: alerta.descripcion,
        estado: alerta.estado,
        fecha: new Date(alerta.fecha_alerta).toISOString().split('T')[0]
      }));
      setAlertas(alertasMapeadas);
    } catch (error) {
      console.error('Error cargando alertas:', error);
      setAlertas(MOCK_ALERTAS);
    } finally {
      setLoading(false);
    }
  };

  const resumen = useMemo(() => {
    const activas = alertas.filter(a => a.estado === "activa");
    return {
      criticas: activas.filter(a => a.prioridad === "critica").length,
      advertencias: activas.filter(a => a.prioridad === "advertencia").length,
      informativas: activas.filter(a => a.prioridad === "informativa").length
    };
  }, [alertas]);

  const alertasFiltradas = useMemo(() => {
    let filtradas = alertas;

    if (filtros.mostrar === "ACTIVAS") {
      filtradas = filtradas.filter(a => a.estado === "activa");
    } else if (filtros.mostrar === "SILENCIADAS") {
      filtradas = filtradas.filter(a => a.estado === "silenciada");
    } else if (filtros.mostrar === "RESUELTAS") {
      filtradas = filtradas.filter(a => a.estado === "resuelta");
    }

    if (filtros.prioridad !== "TODAS") {
      const prioMap = {
        CRÍTICAS: "critica",
        ADVERTENCIAS: "advertencia",
        INFORMATIVAS: "informativa"
      };
      filtradas = filtradas.filter(a => a.prioridad === prioMap[filtros.prioridad]);
    }

    if (filtros.fechaDesde) {
      filtradas = filtradas.filter(a => a.fecha >= filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      filtradas = filtradas.filter(a => a.fecha <= filtros.fechaHasta);
    }

    return filtradas;
  }, [alertas, filtros]);

  const alertasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * alertasPorPagina;
    const fin = inicio + alertasPorPagina;
    return alertasFiltradas.slice(inicio, fin);
  }, [alertasFiltradas, paginaActual]);

  const totalPaginas = Math.ceil(alertasFiltradas.length / alertasPorPagina);

  const handleBadgeClick = (prioridad) => {
    setFiltros(prev => ({ ...prev, prioridad: prioridad.toUpperCase() }));
    setPaginaActual(1);
  };

  const handleBuscar = () => {
    setPaginaActual(1);
  };

  const handleLimpiar = () => {
    setFiltros({
      mostrar: "TODAS",
      prioridad: "TODAS",
      fechaDesde: "",
      fechaHasta: ""
    });
    setPaginaActual(1);
  };

  const handleSilenciar = (alerta) => {
    setAlertaSeleccionada(alerta);
    setSilenciarForm({ justificacion: "", duracion: "24" });
    setShowSilenciarModal(true);
  };

  const handleConfirmarSilenciar = async () => {
    if (!silenciarForm.justificacion.trim()) {
      alert("La justificación es obligatoria");
      return;
    }

    try {
      const duracionMap = {
        "1": "1hora",
        "24": "24horas",
        "168": "7dias",
        "permanente": null
      };

      await apiCall(`/admin/seguridad/alertas/${alertaSeleccionada.id}/silenciar`, 'PATCH', {
        justificacion: silenciarForm.justificacion,
        duracion: duracionMap[silenciarForm.duracion]
      });

      await cargarAlertas();
      setShowSilenciarModal(false);
      setAlertaSeleccionada(null);
    } catch (error) {
      console.error('Error silenciando alerta:', error);
      alert('Error al silenciar la alerta');
    }
  };

  const handleRevisar = async (alertaId) => {
    try {
      await apiCall(`/admin/seguridad/alertas/${alertaId}/revisar`, 'PATCH');
      await cargarAlertas();
    } catch (error) {
      console.error('Error revisando alerta:', error);
      alert('Error al marcar como revisada');
    }
  };

  const getPrioridadIconClass = (prioridad) => {
    switch (prioridad) {
      case "critica":
        return "fa-solid fa-circle-exclamation";
      case "advertencia":
        return "fa-solid fa-triangle-exclamation";
      case "informativa":
        return "fa-solid fa-circle-info";
      default:
        return "fa-solid fa-circle-info";
    }
  };

  const getPrioridadLabel = (prioridad) => {
    switch (prioridad) {
      case "critica":
        return "CRÍTICA";
      case "advertencia":
        return "ADVERTENCIA";
      case "informativa":
        return "INFORMATIVA";
      default:
        return "INFO";
    }
  };

  return (
    <div className="dm2-page">
      <div className="dm2-card">
        <div className="dm2-card-head">
          <div className="dm2-card-title">Alertas de Seguridad y Accesos</div>
          <div className="dm2-card-subtitle">Monitoreo en tiempo real de eventos sospechosos</div>
        </div>

        <div className="dm2-card-body">
          <div className="dm2-alerts-summary">
            <div className="dm2-alerts-badges">
              <button
                className="dm2-alerts-badge dm2-alerts-badge--critica"
                onClick={() => handleBadgeClick("CRÍTICAS")}
              >
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                <span>CRÍTICAS: {resumen.criticas}</span>
              </button>

              <button
                className="dm2-alerts-badge dm2-alerts-badge--advertencia"
                onClick={() => handleBadgeClick("ADVERTENCIAS")}
              >
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                <span>ADVERTENCIAS: {resumen.advertencias}</span>
              </button>

              <button
                className="dm2-alerts-badge dm2-alerts-badge--informativa"
                onClick={() => handleBadgeClick("INFORMATIVAS")}
              >
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                <span>INFORMATIVAS: {resumen.informativas}</span>
              </button>
            </div>
          </div>

          <div className="dm2-alerts-filters">
            <div className="dm2-filters-row">
              <div className="dm2-filter-group">
                <label>Mostrar:</label>
                <select
                  value={filtros.mostrar}
                  onChange={(e) => setFiltros(prev => ({ ...prev, mostrar: e.target.value }))}
                >
                  <option value="TODAS">TODAS</option>
                  <option value="ACTIVAS">ACTIVAS</option>
                  <option value="SILENCIADAS">SILENCIADAS</option>
                  <option value="RESUELTAS">RESUELTAS</option>
                </select>
              </div>

              <div className="dm2-filter-group">
                <label>Prioridad:</label>
                <select
                  value={filtros.prioridad}
                  onChange={(e) => setFiltros(prev => ({ ...prev, prioridad: e.target.value }))}
                >
                  <option value="TODAS">TODAS</option>
                  <option value="CRÍTICAS">CRÍTICAS</option>
                  <option value="ADVERTENCIAS">ADVERTENCIAS</option>
                  <option value="INFORMATIVAS">INFORMATIVAS</option>
                </select>
              </div>

              <div className="dm2-filter-group">
                <label>Fecha desde:</label>
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
                />
              </div>

              <div className="dm2-filter-group">
                <label>Hasta:</label>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
                />
              </div>
            </div>

            <div className="dm2-filters-actions">
              <button className="dm2-btn dm2-btn--primary" onClick={handleBuscar}>
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                <span>BUSCAR</span>
              </button>

              <button className="dm2-btn dm2-btn--secondary" onClick={handleLimpiar}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
                <span>LIMPIAR</span>
              </button>

              <button className="dm2-btn dm2-btn--outline" onClick={() => setShowConfigModal(true)}>
                <i className="fa-solid fa-bell" aria-hidden="true" />
                <span>CONFIGURAR ALERTAS</span>
              </button>
            </div>
          </div>

          <div className="dm2-alerts-list">
            <h3>Alertas de Seguridad</h3>

            {loading ? (
              <div className="dm2-loading">Cargando alertas...</div>
            ) : alertasPaginadas.length === 0 ? (
              <div className="dm2-empty">No hay alertas que coincidan con los filtros</div>
            ) : (
              <>
                <div className="dm2-alerts-items">
                  {alertasPaginadas.map((alerta) => (
                    <div key={alerta.id} className={`dm2-alert-item dm2-alert-item--${alerta.prioridad}`}>
                      <div className="dm2-alert-header">
                        <span className="dm2-alert-time">{alerta.hora}</span>

                        <span className="dm2-alert-priority">
                          <i className={getPrioridadIconClass(alerta.prioridad)} aria-hidden="true" />
                          <span>{getPrioridadLabel(alerta.prioridad)}</span>
                        </span>
                      </div>

                      <div className="dm2-alert-content">
                        <div className="dm2-alert-type">{alerta.tipo.replace("_", " ").toUpperCase()}</div>
                        <div className="dm2-alert-detail">{alerta.detalle}</div>
                      </div>

                      <div className="dm2-alert-actions">
                        {alerta.estado === "activa" && (
                          <>
                            <button className="dm2-btn dm2-btn--small" onClick={() => handleSilenciar(alerta)}>
                              <i className="fa-solid fa-volume-xmark" aria-hidden="true" />
                              <span>SILENCIAR</span>
                            </button>

                            <button
                              className="dm2-btn dm2-btn--small dm2-btn--success"
                              onClick={() => handleRevisar(alerta.id)}
                            >
                              <i className="fa-solid fa-check" aria-hidden="true" />
                              <span>MARCAR COMO REVISADA</span>
                            </button>
                          </>
                        )}

                        {alerta.estado === "silenciada" && (
                          <span className="dm2-alert-status">SILENCIADA</span>
                        )}

                        {alerta.estado === "resuelta" && (
                          <span className="dm2-alert-status">REVISADA</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {totalPaginas > 1 && (
                  <div className="dm2-pagination">
                    <button
                      className="dm2-btn dm2-btn--small"
                      disabled={paginaActual === 1}
                      onClick={() => setPaginaActual(prev => prev - 1)}
                    >
                      <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                    </button>

                    <span>Página {paginaActual} de {totalPaginas}</span>

                    <button
                      className="dm2-btn dm2-btn--small"
                      disabled={paginaActual === totalPaginas}
                      onClick={() => setPaginaActual(prev => prev + 1)}
                    >
                      <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showConfigModal && (
        <div className="dm2-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="dm2-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm2-modal-header">
              <h3>
                <i className="fa-solid fa-bell" aria-hidden="true" /> Configuración de Alertas
              </h3>
              <button onClick={() => setShowConfigModal(false)}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="dm2-modal-body">
              <div className="dm2-empty">Modal en desarrollo...</div>
            </div>
          </div>
        </div>
      )}

      {showSilenciarModal && alertaSeleccionada && (
        <div className="dm2-modal-overlay" onClick={() => setShowSilenciarModal(false)}>
          <div className="dm2-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm2-modal-header">
              <h3>
                <i className="fa-solid fa-volume-xmark" aria-hidden="true" /> Silenciar Alerta de Seguridad
              </h3>
              <button onClick={() => setShowSilenciarModal(false)}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="dm2-modal-body">
              <div className="dm2-silenciar-info">
                <p><strong>Alerta seleccionada:</strong></p>
                <p>Tipo: {alertaSeleccionada.tipo.replace("_", " ").toUpperCase()}</p>
                <p>
                  Prioridad:
                  {" "}
                  <i className={getPrioridadIconClass(alertaSeleccionada.prioridad)} aria-hidden="true" />
                  {" "}
                  {getPrioridadLabel(alertaSeleccionada.prioridad)}
                </p>
                <p>Detalle: {alertaSeleccionada.detalle}</p>
              </div>

              <div className="dm2-form-group">
                <label htmlFor="justificacion">Justificación (obligatoria):</label>
                <textarea
                  id="justificacion"
                  value={silenciarForm.justificacion}
                  onChange={(e) => setSilenciarForm(prev => ({ ...prev, justificacion: e.target.value }))}
                  placeholder="Ej: IP de proveedor externo autorizado, Falso positivo, etc."
                  rows={3}
                  required
                />
              </div>

              <div className="dm2-form-group">
                <label>Silenciar por:</label>
                <div className="dm2-radio-group">
                  <label>
                    <input
                      type="radio"
                      value="1"
                      checked={silenciarForm.duracion === "1"}
                      onChange={(e) => setSilenciarForm(prev => ({ ...prev, duracion: e.target.value }))}
                    />
                    1 hora
                  </label>

                  <label>
                    <input
                      type="radio"
                      value="24"
                      checked={silenciarForm.duracion === "24"}
                      onChange={(e) => setSilenciarForm(prev => ({ ...prev, duracion: e.target.value }))}
                    />
                    24 horas
                  </label>

                  <label>
                    <input
                      type="radio"
                      value="168"
                      checked={silenciarForm.duracion === "168"}
                      onChange={(e) => setSilenciarForm(prev => ({ ...prev, duracion: e.target.value }))}
                    />
                    7 días
                  </label>

                  <label>
                    <input
                      type="radio"
                      value="permanente"
                      checked={silenciarForm.duracion === "permanente"}
                      onChange={(e) => setSilenciarForm(prev => ({ ...prev, duracion: e.target.value }))}
                    />
                    Permanentemente (hasta que se reactive manualmente)
                  </label>
                </div>
              </div>

              <div className="dm2-modal-actions">
                <button
                  className="dm2-btn dm2-btn--primary"
                  onClick={handleConfirmarSilenciar}
                  disabled={!silenciarForm.justificacion.trim()}
                >
                  <i className="fa-solid fa-volume-xmark" aria-hidden="true" />
                  <span>CONFIRMAR SILENCIO</span>
                </button>

                <button className="dm2-btn dm2-btn--secondary" onClick={() => setShowSilenciarModal(false)}>
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                  <span>CANCELAR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}