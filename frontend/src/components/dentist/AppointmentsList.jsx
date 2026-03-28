
import React from 'react';
import './AppointmentsList.css';

const AppointmentsList = ({ citas, onSelectCita, selectedCitaId }) => {
  const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="appointments-list">
      <div className="appointments-header">
        <h3>Mi Agenda - Hoy</h3>
        <span className="appointments-date">
          {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div className="appointments-items">
        {citas.length === 0 ? (
          <div className="no-appointments">
            <i className="fas fa-calendar-day"></i>
            <p>No hay citas programadas para hoy</p>
          </div>
        ) : (
          citas.map(cita => (
            <div 
              key={cita.id} 
              className={`appointment-item ${selectedCitaId === cita.id ? 'selected' : ''}`}
              onClick={() => onSelectCita(cita)}
            >
              <div className="appointment-time">
                <i className="fas fa-clock"></i>
                <span>{formatHora(cita.fecha_hora)}</span>
              </div>
              <div className="appointment-info">
                <div className="appointment-patient">{cita.paciente_nombre}</div>
                <div className="appointment-treatment">{cita.motivo || 'Consulta general'}</div>
              </div>
              <div className={`appointment-status status-${cita.estado}`}>
                {cita.estado === 'confirmada' && 'Confirmada'}
                {cita.estado === 'pendiente' && 'Pendiente'}
                {cita.estado === 'completada' && 'Completada'}
                {cita.estado === 'cancelada' && 'Cancelada'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentsList;