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
 */
function SecurityAlertsScreen() {
  // Estado para alertas
  const [alerts, setAlerts] = useState(mockAlerts);
  const [resumen, setResumen] = useState(mockResumen);
  const [config, setConfig] = useState(mockConfiguracion);

  // Estado para modales
  const [silenceModalOpen, setSilenceModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Calcular alertas activas
  const activeAlerts = alerts.filter(alert => alert.estado === 'activa');

  // Calcular alertas del historial
  const historyAlerts = alerts.filter(alert => ['silenciada', 'revisada'].includes(alert.estado));

  // Función para silenciar alerta
  const handleSilenceAlert = (alertId, duration, justification) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { ...alert, estado: 'silenciada', silencedUntil: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString(), justification }
        : alert
    ));
    setSilenceModalOpen(false);
    setSelectedAlert(null);
  };

  // Función para marcar como revisada
  const handleMarkReviewed = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, estado: 'revisada' } : alert
    ));
  };

  // Función para abrir modal de silencio
  const openSilenceModal = (alert) => {
    setSelectedAlert(alert);
    setSilenceModalOpen(true);
  };

  // Función para actualizar configuración
  const handleUpdateConfig = (newConfig) => {
    setConfig(newConfig);
    setConfigModalOpen(false);
  };

  return (
    <div className="security-alerts-screen">
      <div className="security-header">
        <h1>Alertas de Seguridad</h1>
        <button
          className="security-config-btn"
          onClick={() => setConfigModalOpen(true)}
        >
          <i className="fa-solid fa-gear"></i>
          Configuración
        </button>
      </div>

      {/* Panel de Alertas Activas */}
      <div className="security-section">
        <h2>Alertas Activas</h2>
        <AlertSummary resumen={resumen} />
      </div>

      {/* Listado de Alertas Activas */}
      <div className="security-section">
        <h2>Listado de Alertas</h2>
        <div className="alerts-list">
          {activeAlerts.length === 0 ? (
            <div className="no-alerts">
              <i className="fa-solid fa-shield-check"></i>
              <p>No hay alertas activas</p>
            </div>
          ) : (
            activeAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onSilence={() => openSilenceModal(alert)}
                onMarkReviewed={() => handleMarkReviewed(alert.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Historial de Alertas */}
      <div className="security-section">
        <h2>Historial de Alertas</h2>
        <div className="alerts-list">
          {historyAlerts.length === 0 ? (
            <div className="no-alerts">
              <i className="fa-solid fa-history"></i>
              <p>No hay alertas en el historial</p>
            </div>
          ) : (
            historyAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                isHistory={true}
              />
            ))
          )}
        </div>
      </div>

      {/* Reporte Semanal de Seguridad */}
      <div className="security-section">
        <h2>Reporte Semanal de Seguridad</h2>
        <WeeklySecurityReport />
      </div>

      {/* Modales */}
      {silenceModalOpen && selectedAlert && (
        <SilenceAlertModal
          alert={selectedAlert}
          onClose={() => {
            setSilenceModalOpen(false);
            setSelectedAlert(null);
          }}
          onConfirm={handleSilenceAlert}
        />
      )}

      {configModalOpen && (
        <SecurityConfigModal
          config={config}
          onClose={() => setConfigModalOpen(false)}
          onSave={handleUpdateConfig}
        />
      )}
    </div>
  );
}

export default SecurityAlertsScreen;
