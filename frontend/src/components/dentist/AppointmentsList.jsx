import React, { useState } from 'react';
import CambiarConsultorioModal from './CambiarConsultorioModal';
import './AppointmentsList.css';

const API_URL = "http://localhost:3000/api";

const AppointmentsList = ({ citas, onSelectCita, selectedCitaId, selectedDate }) => {
  const [citaCambio, setCitaCambio] = useState(null);
  const [citasLocal, setCitasLocal] = useState(citas);

  React.useEffect(() => {
    setCitasLocal(citas);
  }, [citas]);

  const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fechaBase = selectedDate ? new Date(selectedDate) : new Date();
  const esHoy = fechaBase.toDateString() === new Date().toDateString();

  // Refresca solo la lista local tras cambiar consultorio
  const refrescarCitas = async () => {
    try {
      const res = await fetch(`${API_URL}/citas/dentista`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      const citasData = Array.isArray(data) ? data : data?.data || [];
      setCitasLocal(citasData);
    } catch (e) {
      // Si falla, no actualiza
    }
  };

  return (
    <div className="appointments-list">
      <div className="appointments-header">
        <h3>{esHoy ? 'Mi Agenda - Hoy' : 'Mi Agenda'}</h3>
        <span className="appointments-date">
          {fechaBase.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </span>
      </div>

      <div className="appointments-items">
        {citasLocal.length === 0 ? (
          <div className="no-appointments">
            <i className="fas fa-calendar-day"></i>
            <p>No hay citas programadas para esta fecha</p>
          </div>
        ) : (
          citasLocal.map((cita) => (
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
                <div className="appointment-treatment">
                  {cita.motivo || 'Consulta general'}
                </div>
              </div>

              <div className={`appointment-status status-${cita.estado}`}>
                {cita.estado === 'confirmada' && 'Confirmada'}
                {cita.estado === 'pendiente' && 'Pendiente'}
                {cita.estado === 'completada' && 'Completada'}
                {cita.estado === 'cancelada' && 'Cancelada'}
                {cita.estado === 'programada' && 'Programada'}
              </div>

              {/* Botón para cambiar consultorio */}
              <button
                className="dm17-btn dm17-btn-small"
                type="button"
                onClick={e => { e.stopPropagation(); setCitaCambio(cita); }}
                style={{ marginLeft: 8 }}
              >
                Cambiar consultorio
              </button>
            </div>
          ))
        )}
      </div>
      {/* Modal de cambio de consultorio */}
      <CambiarConsultorioModal
        open={!!citaCambio}
        cita={citaCambio}
        onClose={() => setCitaCambio(null)}
        onUpdated={() => {
          setCitaCambio(null);
          refrescarCitas();
        }}
      />
    </div>
  );
};

export default AppointmentsList;