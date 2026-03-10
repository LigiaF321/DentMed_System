import React, { useState, useEffect } from 'react';
import { mockResumen, mockAlerts } from '../admin/mockAlertData';

/**
 * Componente: SecurityAlertsWidget
 * Widget para mostrar resumen de alertas de seguridad en el dashboard
 */
function SecurityAlertsWidget({ onViewAll }) {
  const [resumen, setResumen] = useState(mockResumen);
  const [ultimasAlertas, setUltimasAlertas] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    setUltimasAlertas(mockAlerts.slice(0, 3));
  }, []);

  // Función para obtener el ícono según prioridad
  const getPriorityIcon = (prioridad) => {
    switch (prioridad) {
      case 'critica':
        return '🔴';
      case 'advertencia':
        return '🟡';
      case 'informativa':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  // Función para formatear tiempo relativo
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'hace segundos';
    if (minutes < 60) return `hace ${minutes}min`;
    if (hours < 24) return `hace ${hours}h`;
    return 'hace días';
  };

  return (
    <div className="security-widget">
      <div className="security-widget-stats">
        <div className="security-stat critical">
          <div className="stat-number">{resumen.total_criticas}</div>
          <div className="stat-label">Críticas</div>
        </div>
        <div className="security-stat total">
          <div className="stat-number">{resumen.alertas_hoy}</div>
          <div className="stat-label">Total activas</div>
        </div>
      </div>

      <div className="security-widget-alerts">
        {ultimasAlertas.length === 0 ? (
          <div className="security-no-alerts">
            <span className="security-check">✅</span>
            <span>Sin alertas activas</span>
          </div>
        ) : (
          ultimasAlertas.map((alerta) => (
            <div key={alerta.id} className={`security-alert-item ${alerta.prioridad}`}>
              <div className="alert-item-header">
                <span className="alert-priority-icon">
                  {getPriorityIcon(alerta.prioridad)}
                </span>
                <span className="alert-type">
                  {alerta.tipo_alerta.replace('_', ' ')}
                </span>
                <span className="alert-time">
                  {formatTimeAgo(alerta.fecha_alerta)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="security-widget-footer">
        <button
          className="security-view-all-btn"
          onClick={onViewAll}
        >
          Ver todas →
        </button>
      </div>
    </div>
  );
}

export default SecurityAlertsWidget;
