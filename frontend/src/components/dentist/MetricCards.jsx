
import React from 'react';
import './MetricCards.css';

const MetricCards = ({ citasHoy, pacientesVistos, siguienteCita, tratamientosPendientes }) => {
  const metrics = [
    { 
      label: 'Citas Hoy', 
      value: citasHoy, 
      icon: 'fa-calendar-check', 
      color: '#0088cc',
      bgColor: '#e6f3f8'
    },
    { 
      label: 'Pacientes Vistos', 
      value: pacientesVistos, 
      icon: 'fa-user-check', 
      color: '#28a745',
      bgColor: '#e8f5e9'
    },
    { 
      label: 'Siguiente Cita', 
      value: siguienteCita || '--:--', 
      icon: 'fa-hourglass-half', 
      color: '#ffc107',
      bgColor: '#fff3e0'
    },
    { 
      label: 'Tratamientos Pendientes', 
      value: tratamientosPendientes, 
      icon: 'fa-tooth', 
      color: '#ff69b4',
      bgColor: '#ffe6f0'
    }
  ];

  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="metric-card"
          style={{
            borderBottomColor: metric.color,
            '--metric-accent': metric.color,
          }}
        >
          <div className="metric-icon" style={{ backgroundColor: metric.bgColor, color: metric.color }}>
            <i className={`fas ${metric.icon}`}></i>
          </div>
          <div className="metric-content">
            <span className="metric-value dentista-titulo-lg">{metric.value}</span>
            <span className="metric-label dentista-texto-xpequeno">{metric.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricCards;