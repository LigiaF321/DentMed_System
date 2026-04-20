import './styles/dentista-global.css';
import React from 'react';
import './MetricCards.css';

const BRAND = {
  primary:  '#4f46e5',
  secondary: '#db2777',
  border:   '#c4b5fd',
};

const MetricCards = ({ citasHoy, pacientesVistos, siguienteCita, tratamientosPendientes }) => {
  const metrics = [
    {
      label:   'Citas Hoy',
      value:   citasHoy,
      icon:    'fa-calendar-check',
      bg:      '#eff6ff',
      color:   BRAND.primary,
      border:  '#bfdbfe',
    },
    {
      label:   'Pacientes Vistos',
      value:   pacientesVistos,
      icon:    'fa-user-check',
      bg:      '#dcfce7',
      color:   '#166534',
      border:  '#bbf7d0',
    },
    {
      label:   'Siguiente Cita',
      value:   siguienteCita || '--:--',
      icon:    'fa-hourglass-half',
      bg:      '#fef9c3',
      color:   '#854d0e',
      border:  '#fde68a',
    },
    {
      label:   'Tratamientos Pendientes',
      value:   tratamientosPendientes,
      icon:    'fa-tooth',
      bg:      BRAND.primary + '14',
      color:   BRAND.secondary,
      border:  '#f9a8d4',
    },
  ];

  const cardStyle = {
    background:    'white',
    borderRadius:  12,
    padding:       '18px 16px',
    border:        `1px solid ${BRAND.border}`,
    display:       'flex',
    flexDirection: 'column',
    gap:           10,
    boxShadow:     '0 2px 8px rgba(79,70,229,0.06)',
  };

  return (
    <div className="metrics-grid">
      {metrics.map((m, i) => (
        <div key={i} style={cardStyle}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: m.bg, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${m.border}`,
          }}>
            <i className={`fas ${m.icon}`} style={{ fontSize: 14, color: m.color }}></i>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{m.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricCards;