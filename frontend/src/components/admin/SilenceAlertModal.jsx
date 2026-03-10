import React, { useState } from 'react';
import './SecurityAlerts.css';

/**
 * Componente: SilenceAlertModal
 * Modal para silenciar una alerta con justificación y duración
 */
function SilenceAlertModal({ alert, isOpen, onClose, onConfirm }) {
  const [justification, setJustification] = useState('');
  const [duration, setDuration] = useState('24'); // Horas

  const handleConfirm = () => {
    if (!justification.trim()) {
      alert('La justificación es obligatoria');
      return;
    }
    onConfirm(alert.id, justification, duration);
    setJustification('');
    setDuration('24');
  };

  const handleClose = () => {
    setJustification('');
    setDuration('24');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔇 Silenciar Alerta de Seguridad</h2>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Información de la alerta */}
          <div className="silence-alert-info">
            <h4>Alerta Seleccionada</h4>
            <div className="alert-summary-compact">
              <p>
                <strong>Tipo:</strong> {alert.tipo_alerta}
              </p>
              <p>
                <strong>Prioridad:</strong> {alert.prioridad.toUpperCase()}
              </p>
              <p>
                <strong>Descripción:</strong> {alert.descripcion}
              </p>
            </div>
          </div>

          {/* Justificación */}
          <div className="form-group">
            <label htmlFor="justification">
              <strong>Justificación *</strong>
            </label>
            <textarea
              id="justification"
              className="form-control"
              rows={4}
              placeholder="Ej: IP de proveedor externo autorizado, Falso positivo, etc."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            {!justification.trim() && (
              <small className="text-danger">La justificación es obligatoria</small>
            )}
          </div>

          {/* Duración */}
          <div className="form-group">
            <label>
              <strong>Duración del Silenciamiento</strong>
            </label>
            <div className="duration-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="duration"
                  value="1"
                  checked={duration === '1'}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <span>1 hora</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="duration"
                  value="24"
                  checked={duration === '24'}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <span>24 horas</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="duration"
                  value="168"
                  checked={duration === '168'}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <span>7 días</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="duration"
                  value="null"
                  checked={duration === 'null'}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <span>Permanentemente</span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
          >
            ✕ CANCELAR
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!justification.trim()}
          >
            🔇 CONFIRMAR SILENCIO
          </button>
        </div>
      </div>
    </div>
  );
}

export default SilenceAlertModal;
