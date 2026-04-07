import React, { useState } from 'react';
import { reprogramarCita } from '../../services/citas.service';
import '../styles/ReprogramarCitaModal.css';

const MOTIVOS_REPROGRAMACION = [
  "Cambio de horario del paciente",
  "Cambio de disponibilidad del dentista",
  "Mantenimiento del consultorio",
  "Otra ubicación disponible",
  "Solicitud del paciente",
  "Cambio de duración estimada",
  "Otro",
];

const ReprogramarCitaModal = ({
  cita,
  nuevaFecha,
  nuevaHora,
  onConfirm,
  onCancel,
}) => {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(MOTIVOS_REPROGRAMACION[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [horariosAlternativos, setHorariosAlternativos] = useState([]);
  const [mostrarAlternativas, setMostrarAlternativas] = useState(false);
  const [horarioSeleccionadoAlt, setHorarioSeleccionadoAlt] = useState(null);
  const [notificarPaciente, setNotificarPaciente] = useState(true);

  const formatoFecha = (fecha) => {
    if (!fecha) return '';
    
    // Si es un string de fecha ISO (YYYY-MM-DD), convertir a Date
    if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    
    // Si es un Date object
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatoHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleConfirmar = async (fechaParam = nuevaFecha, horaParam = nuevaHora) => {
    setError('');

    if (!motivoSeleccionado) {
      setError('Por favor selecciona un motivo de reprogramación');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        fecha: fechaParam,
        hora: horaParam,
        duracion: cita.duracion_estimada || 30,
        motivo_reprogramacion: motivoSeleccionado,
        notificar_paciente: notificarPaciente,
      };

      const response = await reprogramarCita(cita.id, payload);

      if (response.ok) {
        setLoading(false);
        onConfirm(response.data);
      }
    } catch (err) {
      setLoading(false);
      const errorMsg = err.message || 'Error al reprogramar la cita';
      setError(errorMsg);

      // Si hay horarios alternativos en el error, mostrarlos
      if (err.response?.data?.horariosAlternativos && err.response.data.horariosAlternativos.length > 0) {
        setHorariosAlternativos(err.response.data.horariosAlternativos);
        setMostrarAlternativas(true);
      }

      console.error('Error:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content reprogramar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirmación de Reprogramación</h3>
          <button className="close-btn" onClick={onCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {!mostrarAlternativas ? (
            <>
              <div className="cita-info-section">
                <div className="info-box">
                  <label>Cita Actual</label>
                  <div className="info-content">
                    <p>
                      <i className="fas fa-calendar"></i>
                      {' '}
                      {formatoFecha(cita.fecha_hora)}
                    </p>
                    <p>
                      <i className="fas fa-clock"></i>
                      {' '}
                      {formatoHora(cita.fecha_hora)}
                    </p>
                    <p>
                      <i className="fas fa-user"></i>
                      {' '}
                      {cita.paciente?.nombre || 'Paciente'}
                    </p>
                  </div>
                </div>

                <div className="arrow-separator">
                  <i className="fas fa-arrow-right"></i>
                </div>

                <div className="info-box highlight">
                  <label>Nueva Programación</label>
                  <div className="info-content">
                    <p>
                      <i className="fas fa-calendar"></i>
                      {' '}
                      {formatoFecha(nuevaFecha)}
                    </p>
                    <p>
                      <i className="fas fa-clock"></i>
                      {' '}
                      {nuevaHora}
                    </p>
                    <p>
                      <i className="fas fa-user"></i>
                      {' '}
                      {cita.paciente?.nombre || 'Paciente'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="motivo">Motivo de la Reprogramación</label>
                <select
                  id="motivo"
                  value={motivoSeleccionado}
                  onChange={(e) => setMotivoSeleccionado(e.target.value)}
                  className="form-control"
                >
                  {MOTIVOS_REPROGRAMACION.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={notificarPaciente}
                    onChange={(e) => setNotificarPaciente(e.target.checked)}
                  />
                  <span className="checkbox-label">
                    <i className="fas fa-bell"></i>
                    {' '}
                    Notificar al paciente por correo electrónico
                  </span>
                </label>
              </div>
            </>
          ) : (
            <div className="alternativas-section">
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>

              <div className="sugerencias-box">
                <h4>
                  <i className="fas fa-lightbulb"></i>
                  {' '}
                  Horarios disponibles sugeridos
                </h4>
                <p className="sugerencias-subtitle">
                  Selecciona uno de los siguientes horarios alternativos:
                </p>
                <div className="horarios-grid">
                  {horariosAlternativos.map((horario, index) => (
                    <button
                      key={index}
                      className={`horario-btn ${
                        horarioSeleccionadoAlt?.fecha === horario.fecha &&
                        horarioSeleccionadoAlt?.hora === horario.hora
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() => setHorarioSeleccionadoAlt(horario)}
                    >
                      <div className="horario-fecha">{horario.displayFecha}</div>
                      <div className="horario-hora">{horario.displayHora}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="motivo-selector-alt">
                <label htmlFor="motivo-alt">Motivo</label>
                <select
                  id="motivo-alt"
                  value={motivoSeleccionado}
                  onChange={(e) => setMotivoSeleccionado(e.target.value)}
                  className="form-control"
                >
                  {MOTIVOS_REPROGRAMACION.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="checkbox-group checkbox-group-alt">
                <label>
                  <input
                    type="checkbox"
                    checked={notificarPaciente}
                    onChange={(e) => setNotificarPaciente(e.target.checked)}
                  />
                  <span className="checkbox-label">
                    <i className="fas fa-bell"></i>
                    {' '}
                    Notificar al paciente por correo electrónico
                  </span>
                </label>
              </div>
            </div>
          )}

          {error && !mostrarAlternativas && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!mostrarAlternativas ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleConfirmar(nuevaFecha, nuevaHora)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    {' '}
                    Reprogramando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    {' '}
                    Confirmar Reprogramación
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setMostrarAlternativas(false);
                  setHorariosAlternativos([]);
                  setHorarioSeleccionadoAlt(null);
                  setError('');
                }}
                disabled={loading}
              >
                <i className="fas fa-arrow-left"></i>
                {' '}
                Volver Atrás
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!horarioSeleccionadoAlt) {
                    setError('Por favor selecciona uno de los horarios sugeridos');
                    return;
                  }
                  handleConfirmar(
                    horarioSeleccionadoAlt.fecha,
                    horarioSeleccionadoAlt.hora
                  );
                }}
                disabled={loading || !horarioSeleccionadoAlt}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    {' '}
                    Reprogramando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    {' '}
                    Confirmar con Este Horario
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReprogramarCitaModal;
