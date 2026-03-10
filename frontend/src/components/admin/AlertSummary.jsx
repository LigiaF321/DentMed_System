import React from 'react';
import './SecurityAlerts.css';

/**
 * Componente: AlertSummary
 * Muestra un resumen de alertas por prioridad en forma de badges/tarjetas
 */
function AlertSummary({ resumen, onFilterByPriority }) {
  return (
    <div className="alert-summary">
      <h3 className="summary-title">Resumen por Prioridad</h3>
      <div className="summary-badges">
        <button
          className="summary-badge badge-critical"
          onClick={() => onFilterByPriority('critica')}
          title="Filtrar por alertas críticas"
        >
          <span className="badge-icon">🔴</span>
          <span className="badge-label">CRÍTICAS</span>
          <span className="badge-count">{resumen.total_criticas}</span>
        </button>

        <button
          className="summary-badge badge-warning"
          onClick={() => onFilterByPriority('advertencia')}
          title="Filtrar por advertencias"
        >
          <span className="badge-icon">🟡</span>
          <span className="badge-label">ADVERTENCIAS</span>
          <span className="badge-count">{resumen.total_advertencias}</span>
        </button>

        <button
          className="summary-badge badge-info"
          onClick={() => onFilterByPriority('informativa')}
          title="Filtrar por alertas informativas"
        >
          <span className="badge-icon">ℹ️</span>
          <span className="badge-label">INFORMATIVAS</span>
          <span className="badge-count">{resumen.total_informativas}</span>
        </button>
      </div>
    </div>
  );
}

export default AlertSummary;
