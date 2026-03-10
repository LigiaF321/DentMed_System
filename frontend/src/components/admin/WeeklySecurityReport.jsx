import React from 'react';
import { mockReporteSemanal } from './mockAlertData';

/**
 * Componente: WeeklySecurityReport
 * Muestra el reporte semanal de seguridad con estadísticas y eventos principales
 */
function WeeklySecurityReport() {
  const reporte = mockReporteSemanal;

  const formatDateRange = (inicio, fin) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const inicioStr = inicio.toLocaleDateString('es-ES', options);
    const finStr = fin.toLocaleDateString('es-ES', options);
    return `${inicioStr} al ${finStr}`;
  };

  const handleExport = () => {
    // Simulación de exportación
    console.log('Exportando reporte');
    alert('Exportando reporte semanal');
  };

  return (
    <div className="weekly-report">
      <div className="report-header">
        <h2>Reporte Semanal de Seguridad</h2>
        <p className="report-period">Semana del {formatDateRange(reporte.periodo.inicio, reporte.periodo.fin)}</p>
      </div>

      {/* RESUMEN ESTADÍSTICO */}
      <div className="report-summary">
        <h3>Resumen Estadístico</h3>
        <div className="summary-stats">
          <div className="summary-stat">
            <div className="stat-value">{reporte.resumen.total_alertas}</div>
            <div className="stat-label">Total de Alertas</div>
          </div>
          <div className="summary-stat critical">
            <div className="stat-value">{reporte.resumen.criticas}</div>
            <div className="stat-label">Críticas</div>
          </div>
          <div className="summary-stat warning">
            <div className="stat-value">{reporte.resumen.advertencias}</div>
            <div className="stat-label">Advertencias</div>
          </div>
          <div className="summary-stat info">
            <div className="stat-value">{reporte.resumen.informativas}</div>
            <div className="stat-label">Informativas</div>
          </div>
        </div>
      </div>

      {/* EVOLUCIÓN POR DÍA */}
      <div className="report-evolution">
        <h3>Evolución por Día</h3>
        <div className="evolution-list">
          {reporte.por_dia.map((dia, index) => (
            <div key={index} className="evolution-item">
              <span className="evolution-day">{dia.dia}:</span>
              <span className="evolution-count">{dia.alertas} alertas</span>
            </div>
          ))}
        </div>
      </div>

      {/* PRINCIPALES EVENTOS */}
      <div className="report-events">
        <h3>Principales Eventos</h3>
        <div className="events-list">
          {reporte.estadisticas.ips_top.slice(0, 5).map((ip, index) => (
            <div key={index} className="event-item">
              <span className="event-icon">🔴</span>
              <span className="event-text">
                {ip.intentos} intentos fallidos desde IP {ip.ip}
              </span>
            </div>
          ))}

          {reporte.estadisticas.accesos_fuera_horario.map((acceso, index) => (
            <div key={index} className="event-item">
              <span className="event-icon">🟡</span>
              <span className="event-text">
                {acceso.accesos} accesos fuera de horario por {acceso.usuario}
              </span>
            </div>
          ))}

          <div className="event-item">
            <span className="event-icon">ℹ️</span>
            <span className="event-text">
              {reporte.estadisticas.nuevos_dispositivos} nuevos dispositivos detectados
            </span>
          </div>

          <div className="event-item">
            <span className="event-icon">🛡️</span>
            <span className="event-text">
              {reporte.estadisticas.cuentas_bloqueadas} cuentas bloqueadas temporalmente
            </span>
          </div>
        </div>
      </div>

      {/* BOTÓN DE EXPORTACIÓN */}
      <div className="report-export">
        <button
          className="btn btn-secondary"
          onClick={handleExport}
        >
          Exportar Reporte
        </button>
      </div>
    </div>
  );
}

export default WeeklySecurityReport;
