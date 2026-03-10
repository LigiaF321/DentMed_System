import React from 'react';
import './SecurityAlerts.css';

/**
 * Componente: AlertCard
 * Renderiza una tarjeta individual de alerta con información y acciones
 */
function AlertCard({ alert, onSilence, onReview }) {
  // Función para formatear la hora relativa (ej: "hace 15 minutos")
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'hace unos segundos';
    if (minutes < 60) return `hace ${minutes} min`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${days}d`;
  };

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

  // Función para obtener el tipo de alerta en texto legible
  const getTipoAlertaLabel = (tipo) => {
    const tipos = {
      intentos_fallidos: 'Intentos Fallidos',
      acceso_fuera_horario: 'Acceso Fuera de Horario',
      cuenta_bloqueada: 'Cuenta Bloqueada',
      ip_sospechosa: 'IP Sospechosa',
      cambio_clave_inusual: 'Cambio de Clave Inusual',
      nuevo_dispositivo: 'Nuevo Dispositivo',
    };
    return tipos[tipo] || tipo;
  };

  // Función para obtener la clase CSS según estado
  const getStatusClass = (estado) => {
    switch (estado) {
      case 'activa':
        return 'alert-status-active';
      case 'silenciada':
        return 'alert-status-silenced';
      case 'revisada':
        return 'alert-status-reviewed';
      case 'resuelta':
        return 'alert-status-resolved';
      default:
        return '';
    }
  };

  const isActive = alert.estado === 'activa';
  const isSilenced = alert.estado === 'silenciada';
  const isReviewed = alert.estado === 'revisada';

  return (
    <div className={`alert-card alert-${alert.prioridad} ${getStatusClass(alert.estado)}`}>
      <div className="alert-header">
        <div className="alert-time-priority">
          <span className="alert-priority">
            {getPriorityIcon(alert.prioridad)} {alert.prioridad.toUpperCase()}
          </span>
          <span className="alert-time">[{formatTimeAgo(alert.fecha_alerta)}]</span>
        </div>
        {isSilenced && (
          <span className="alert-badge badge-silenced">🔇 SILENCIADA</span>
        )}
        {isReviewed && (
          <span className="alert-badge badge-reviewed">✅ REVISADA</span>
        )}
      </div>

      <div className="alert-content">
        <div className="alert-type-title">
          <strong>{getTipoAlertaLabel(alert.tipo_alerta)}</strong>
        </div>

        <div className="alert-description">
          <p className="main-description">{alert.descripcion}</p>
          <p className="detail-description">{alert.detalle}</p>
        </div>

        {alert.ip_origen && (
          <div className="alert-meta">
            <span className="meta-item">
              <strong>IP:</strong> {alert.ip_origen}
            </span>
          </div>
        )}

        {alert.usuario_nombre && (
          <div className="alert-meta">
            <span className="meta-item">
              <strong>Usuario:</strong> {alert.usuario_nombre}
            </span>
          </div>
        )}

        {isSilenced && alert.justificacion_silencio && (
          <div className="alert-silenced-info">
            <p>
              <strong>Justificación:</strong> {alert.justificacion_silencio}
            </p>
          </div>
        )}
      </div>

      <div className="alert-actions">
        {isActive && (
          <>
            <button
              className="btn btn-silence"
              onClick={() => onSilence(alert)}
              title="Silenciar esta alerta"
            >
              🔇 SILENCIAR
            </button>
            <button
              className="btn btn-review"
              onClick={() => onReview(alert)}
              title="Marcar como revisada"
            >
              ✅ REVISAR
            </button>
          </>
        )}
        {isSilenced && (
          <button
            className="btn btn-reactivate"
            onClick={() => onReview(alert)}
            title="Reactivar alerta"
          >
            ↻ REACTIVAR
          </button>
        )}
        {isReviewed && (
          <span className="alert-reviewed-info">Revisada anteriormente</span>
        )}
      </div>
    </div>
  );
}

export default AlertCard;
