import React from 'react';
import './SecurityAlerts.css';

/**
 * Componente: AlertSummary
 * Muestra un resumen de alertas por prioridad en forma de badges/tarjetas
 */
function AlertSummary({ resumen }) {
  return (
    <div className="alert-summary">
      <h3 className="summary-title">Resumen por Prioridad</h3>
      <div className="summary-badges">
        <div className="summary-badge badge-critical">
          <span className="badge-icon">🔴</span>
          <span className="badge-label">CRÍTICAS</span>
          <span className="badge-count">{resumen.total_criticas}</span>
        </div>

        <div className="summary-badge badge-warning">
          <span className="badge-icon">🟡</span>
          <span className="badge-label">ADVERTENCIAS</span>
          <span className="badge-count">{resumen.total_advertencias}</span>
        </div>

        <div className="summary-badge badge-info">
          <span className="badge-icon">ℹ️</span>
          <span className="badge-label">INFORMATIVAS</span>
          <span className="badge-count">{resumen.total_informativas}</span>
        </div>
      </div>
    </div>
  );
}

export default AlertSummary;
