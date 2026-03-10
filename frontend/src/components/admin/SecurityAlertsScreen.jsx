import React, { useState, useEffect } from 'react';
import AlertCard from './AlertCard';
import AlertSummary from './AlertSummary';
import SilenceAlertModal from './SilenceAlertModal';
import SecurityConfigModal from './SecurityConfigModal';
import WeeklySecurityReport from './WeeklySecurityReport';
import { mockAlerts, mockResumen, mockConfiguracion } from './mockAlertData';
import './SecurityAlerts.css';

/**
 * Componente Principal: SecurityAlertsScreen
 * Pantalla de alertas de seguridad y accesos
 * - Muestra resumen, filtros y listado de alertas
 * - Permite silenciar, revisar y configurar alertas
 */
function SecurityAlertsScreen() {
  // Estado para alertas
  const [alerts, setAlerts] = useState(mockAlerts);
  const [resumen, setResumen] = useState(mockResumen);
  const [config, setConfig] = useState(mockConfiguracion);

  // Estado para filtros
  const [filters, setFilters] = useState({
    estado: 'todas',
    prioridad: 'todas',
    fechaDesde: '',
    fechaHasta: '',
  });

  // Estado para modales
  const [silenceModalOpen, setSilenceModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Estado para pestañas
  const [activeTab, setActiveTab] = useState('activas');

  // Calcular alertas filtradas
  const filteredAlerts = alerts.filter((alert) => {
    // Filtrar por pestaña activa
    if (activeTab === 'activas') {
      if (!['activa'].includes(alert.estado)) return false;
    } else if (activeTab === 'historial') {
      if (!['silenciada', 'revisada', 'resuelta'].includes(alert.estado)) return false;
    }

    // Filtro por estado (solo en pestaña activas)
    if (activeTab === 'activas' && filters.estado !== 'todas' && alert.estado !== filters.estado) {
      return false;
    }

    // Filtro por prioridad
    if (filters.prioridad !== 'todas' && alert.prioridad !== filters.prioridad) {
      return false;
    }

    // Filtro por fecha
    if (filters.fechaDesde) {
      const alertDate = new Date(alert.fecha_alerta);
      const filterDate = new Date(filters.fechaDesde);
      if (alertDate < filterDate) return false;
    }

    if (filters.fechaHasta) {
      const alertDate = new Date(alert.fecha_alerta);
      const filterDate = new Date(filters.fechaHasta);
      filterDate.setHours(23, 59, 59, 999);
      if (alertDate > filterDate) return false;
    }

    return true;
  });

  // Paginación
  const totalPages = Math.ceil(filteredAlerts.length / alertsPerPage);
  const startIndex = (currentPage - 1) * alertsPerPage;
  const paginatedAlerts = filteredAlerts.slice(
    startIndex,
    startIndex + alertsPerPage
  );

  // Manejadores
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1); // Reset a primera página
  };

  const handleFilterByPriority = (priority) => {
    setFilters((prev) => ({
      ...prev,
      prioridad: prev.prioridad === priority ? 'todas' : priority,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      estado: 'todas',
      prioridad: 'todas',
      fechaDesde: '',
      fechaHasta: '',
    });
    setCurrentPage(1);
  };

  const handleSilenceClick = (alert) => {
    setSelectedAlert(alert);
    setSilenceModalOpen(true);
  };

  const handleReviewClick = (alert) => {
    // Cambiar estado de la alerta
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id ? { ...a, estado: 'revisada' } : a
      )
    );

    // Actualizar resumen
    updateResumen();
  };

  const handleSilenceConfirm = (alertId, justification, duration) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === alertId) {
          const durationMs = duration === 'null' ? null : parseInt(duration) * 3600000;
          return {
            ...a,
            estado: 'silenciada',
            justificacion_silencio: justification,
            silenciada_por: 1, // Usuario actual (mock)
            silenciada_hasta: durationMs ? new Date(Date.now() + durationMs) : null,
          };
        }
        return a;
      })
    );
    setSilenceModalOpen(false);
    setSelectedAlert(null);
    updateResumen();
  };

  const handleConfigSave = (newConfig) => {
    setConfig(newConfig);
    setConfigModalOpen(false);
    // Aquí llamarías a la API para guardar la configuración
    console.log('Configuración guardada:', newConfig);
  };

  const updateResumen = () => {
    const criticas = alerts.filter((a) => a.prioridad === 'critica').length;
    const advertencias = alerts.filter((a) => a.prioridad === 'advertencia').length;
    const informativas = alerts.filter((a) => a.prioridad === 'informativa').length;

    setResumen((prev) => ({
      ...prev,
      total_criticas: criticas,
      total_advertencias: advertencias,
      total_informativas: informativas,
    }));
  };

  return (
    <div className="security-alerts-screen">
      {/* HEADER */}
      <div className="alerts-header">
        <div className="header-title">
          <h1>🔔 Alertas de Seguridad y Accesos</h1>
          <p className="header-subtitle">
            Monitoreo en tiempo real de eventos sospechosos
          </p>
        </div>
      </div>

      {/* PESTAÑAS */}
      <div className="alerts-tabs">
        <button
          className={`tab-button ${activeTab === 'activas' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('activas');
            setFilters(prev => ({ ...prev, estado: 'todas' }));
            setCurrentPage(1);
          }}
        >
          Activas
        </button>
        <button
          className={`tab-button ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('historial');
            setFilters(prev => ({ ...prev, estado: 'todas' }));
            setCurrentPage(1);
          }}
        >
          Historial
        </button>
        <button
          className={`tab-button ${activeTab === 'reporte' ? 'active' : ''}`}
          onClick={() => setActiveTab('reporte')}
        >
          Reporte Semanal
        </button>
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
      {activeTab === 'activas' && (
        <>
          {/* RESUMEN DE PRIORIDADES */}
          <AlertSummary
            resumen={resumen}
            onFilterByPriority={handleFilterByPriority}
          />

          {/* SECCIÓN DE FILTROS */}
          <div className="filters-section">
            <h3>🔍 Filtros y Búsqueda</h3>
            <div className="filters-container">
              {/* Filtro: Estado */}
              <div className="filter-group">
                <label htmlFor="filter-estado">Mostrar:</label>
                <select
                  id="filter-estado"
                  value={filters.estado}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                >
                  <option value="todas">TODAS</option>
                  <option value="activa">ACTIVAS</option>
                  <option value="silenciada">SILENCIADAS</option>
                  <option value="revisada">REVISADAS</option>
                  <option value="resuelta">RESUELTAS</option>
                </select>
              </div>

              {/* Filtro: Prioridad */}
              <div className="filter-group">
                <label htmlFor="filter-prioridad">Prioridad:</label>
                <select
                  id="filter-prioridad"
                  value={filters.prioridad}
                  onChange={(e) => handleFilterChange('prioridad', e.target.value)}
                >
                  <option value="todas">TODAS</option>
                  <option value="critica">CRÍTICAS</option>
                  <option value="advertencia">ADVERTENCIAS</option>
                  <option value="informativa">INFORMATIVAS</option>
                </select>
              </div>

              {/* Filtro: Fecha Desde */}
              <div className="filter-group">
                <label htmlFor="filter-fecha-desde">Desde:</label>
                <input
                  id="filter-fecha-desde"
                  type="date"
                  value={filters.fechaDesde}
                  onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                />
              </div>

              {/* Filtro: Fecha Hasta */}
              <div className="filter-group">
                <label htmlFor="filter-fecha-hasta">Hasta:</label>
                <input
                  id="filter-fecha-hasta"
                  type="date"
                  value={filters.fechaHasta}
                  onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                />
              </div>

              {/* Botones de acción */}
              <div className="filter-actions">
                <button
                  className="btn btn-primary-small"
                  onClick={handleClearFilters}
                >
                  ✖️ LIMPIAR
                </button>
                <button
                  className="btn btn-secondary-small"
                  onClick={() => setConfigModalOpen(true)}
                >
                  🔔 CONFIGURAR
                </button>
              </div>
            </div>
          </div>

          {/* LISTADO DE ALERTAS */}
          <div className="alerts-list-section">
            <h3>Alertas Activas ({filteredAlerts.length})</h3>

            {paginatedAlerts.length > 0 ? (
              <>
                <div className="alerts-list">
                  {paginatedAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onSilence={handleSilenceClick}
                      onReview={handleReviewClick}
                    />
                  ))}
                </div>

                {/* PAGINACIÓN */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Anterior
                    </button>

                    <span className="pagination-info">
                      Página {currentPage} de {totalPages}
                    </span>

                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <p>No hay alertas que coincidan con los filtros seleccionados</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'historial' && (
        <div className="alerts-list-section">
          <h3>Historial de Alertas ({filteredAlerts.length})</h3>

          {paginatedAlerts.length > 0 ? (
            <>
              <div className="alerts-list">
                {paginatedAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onSilence={handleSilenceClick}
                    onReview={handleReviewClick}
                  />
                ))}
              </div>

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Anterior
                  </button>

                  <span className="pagination-info">
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>No hay alertas en el historial</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reporte' && (
        <WeeklySecurityReport />
      )}

      {/* MODALES */}
      {selectedAlert && (
        <SilenceAlertModal
          alert={selectedAlert}
          isOpen={silenceModalOpen}
          onClose={() => setSilenceModalOpen(false)}
          onConfirm={handleSilenceConfirm}
        />
      )}

      <SecurityConfigModal
        config={config}
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onSave={handleConfigSave}
      />
    </div>
  );
}

export default SecurityAlertsScreen;
