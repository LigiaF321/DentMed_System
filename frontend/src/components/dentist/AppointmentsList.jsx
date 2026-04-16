import React, { useEffect, useState } from "react";
import "./AppointmentsList.css";

const AppointmentsList = ({
  citas,
  onSelectCita,
  selectedCitaId,
  selectedDate,
  onVerDetalles,
}) => {
  const [citasLocal, setCitasLocal] = useState(citas || []);

  useEffect(() => {
    setCitasLocal(Array.isArray(citas) ? citas : []);
  }, [citas]);

  const formatHora = (fecha) =>
    new Date(fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const fechaBase = selectedDate ? new Date(selectedDate) : new Date();
  const esHoy     = fechaBase.toDateString() === new Date().toDateString();

  // Cita a mostrar: la seleccionada o la próxima pendiente
  const ahora = new Date();
  const citaAMostrar = citasLocal.find(c => String(c.id) === String(selectedCitaId))
    || citasLocal.find(c => {
        const estado = String(c.estado || '').toLowerCase();
        return !['cancelada', 'completada'].includes(estado) && new Date(c.fecha_hora) >= ahora;
      })
    || citasLocal[0]
    || null;

  const estadoLabel = {
    confirmada:   'Confirmada',
    pendiente:    'Pendiente',
    completada:   'Completada',
    cancelada:    'Cancelada',
    programada:   'Programada',
    reprogramada: 'Reprogramada',
  };

  const estadoColor = {
    confirmada:   '#28a745',
    pendiente:    '#17a2b8',
    completada:   '#6c757d',
    cancelada:    '#dc3545',
    programada:   '#2563eb',
    reprogramada: '#f59e0b',
  };

  return (
    <div className="appointments-list">
      <div className="appointments-header">
        <h3>{esHoy ? 'Mi Agenda - Hoy' : 'Mi Agenda'}</h3>
        <span className="appointments-date">
          {fechaBase.toLocaleDateString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric',
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
          <>
            {/* ── Resumen de la cita activa ── */}
            {citaAMostrar && (
              <div
                className={`appointment-item selected`}
                onClick={() => onSelectCita(citaAMostrar)}
                style={{ cursor: 'pointer' }}
              >
                <div className="appointment-time dentista-texto-xpequeno">
                  <i className="fas fa-clock"></i>
                  <span>{formatHora(citaAMostrar.fecha_hora)}</span>
                </div>

                <div className="appointment-info">
                  <div className="appointment-patient dentista-texto-pequeno">
                    {citaAMostrar.paciente_nombre}
                  </div>
                  <div className="appointment-treatment dentista-texto-xxpequeno">
                    {citaAMostrar.motivo || 'Consulta general'}
                  </div>
                  {citaAMostrar.id_consultorio && (
                    <div className="dentista-label" style={{ color: '#6b7280', marginTop: 2 }}>
                      <i className="fas fa-door-open" style={{ marginRight: 4 }}></i>
                      Consultorio {citaAMostrar.id_consultorio}
                    </div>
                  )}
                </div>

                <div
                  className={`appointment-status dentista-label`}
                  style={{
                    color: estadoColor[String(citaAMostrar.estado || '').toLowerCase()] || '#374151',
                    fontWeight: 700,
                  }}
                >
                  {estadoLabel[String(citaAMostrar.estado || '').toLowerCase()] || citaAMostrar.estado}
                </div>
              </div>
            )}

            {/* ── Contador de citas del día ── */}
            <div className="dentista-texto-xxpequeno" style={{ color: '#6b7280', padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <i className="fas fa-list" style={{ marginRight: 5 }}></i>
                {citasLocal.length} cita{citasLocal.length !== 1 ? 's' : ''} este día
              </span>
              <span style={{ color: '#28a745', fontWeight: 700 }}>
                {citasLocal.filter(c => !['cancelada','completada'].includes(String(c.estado||'').toLowerCase())).length} pendientes
              </span>
            </div>

            {/* ── Botón Ver detalles ── */}
            <button
              onClick={onVerDetalles}
                        style={{
                          width: '100%', padding: '10px 0', borderRadius: 10,
                          border: 'none',
                          background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                          color: 'white', fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                          marginTop: 6,
                        }} className="dentista-label"
            >
              <i className="fas fa-calendar-check"></i> Ver todas las citas
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentsList;