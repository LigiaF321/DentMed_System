import React, { useState, useEffect } from 'react';
import './SecurityAlerts.css';

/**
 * Componente: SecurityConfigModal
 * Modal para configurar alertas de seguridad
 */
function SecurityConfigModal({ config, onClose, onSave }) {
  const [formData, setFormData] = useState(config);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configuración de Alertas de Seguridad</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Umbrales de alertas críticas */}
          <div className="config-section">
            <h3>Umbrales de Alertas Críticas</h3>
            <div className="form-group">
              <label htmlFor="intentos_fallidos_umbral">
                Número de intentos fallidos para alerta crítica:
              </label>
              <input
                id="intentos_fallidos_umbral"
                type="number"
                min="1"
                value={formData.intentos_fallidos_umbral}
                onChange={(e) =>
                  handleChange('intentos_fallidos_umbral', parseInt(e.target.value))
                }
              />
            </div>
          </div>

          {/* Notificaciones por email */}
          <div className="config-section">
            <h3>Notificaciones por Email</h3>
            <div className="form-group checkbox-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={formData.enviar_email_criticas}
                  onChange={(e) => handleChange('enviar_email_criticas', e.target.checked)}
                />
                <span>Enviar email por alertas críticas</span>
              </label>
            </div>
          </div>

          {/* Duración automática de silenciamiento */}
          <div className="config-section">
            <h3>Duración Automática de Silenciamiento</h3>
            <div className="form-group">
              <label htmlFor="silencio_duracion_horas">
                Duración en horas:
              </label>
              <input
                id="silencio_duracion_horas"
                type="number"
                min="1"
                value={formData.silencio_duracion_horas}
                onChange={(e) =>
                  handleChange('silencio_duracion_horas', parseInt(e.target.value))
                }
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}

export default SecurityConfigModal;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔔 Configuración de Alertas de Seguridad</h2>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* SECCIÓN: Umbrales de Seguridad */}
          <div className="config-section">
            <h3>🛡️ Umbrales de Seguridad</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="intentos_fallidos_umbral">
                  <strong>Intentos Fallidos</strong>
                </label>
                <input
                  id="intentos_fallidos_umbral"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.intentos_fallidos_umbral}
                  onChange={(e) =>
                    handleChange('intentos_fallidos_umbral', parseInt(e.target.value))
                  }
                />
                <small>Intentos en ventana de tiempo para generar alerta CRÍTICA</small>
              </div>

              <div className="form-group">
                <label htmlFor="ventana_minutos">
                  <strong>Ventana (minutos)</strong>
                </label>
                <input
                  id="ventana_minutos"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.ventana_minutos}
                  onChange={(e) => handleChange('ventana_minutos', parseInt(e.target.value))}
                />
                <small>Período de tiempo para contar intentos</small>
              </div>

              <div className="form-group">
                <label htmlFor="bloqueo_intentos">
                  <strong>Bloquear Después de</strong>
                </label>
                <input
                  id="bloqueo_intentos"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.bloqueo_intentos}
                  onChange={(e) => handleChange('bloqueo_intentos', parseInt(e.target.value))}
                />
                <small>Intentos fallidos para bloquear cuenta</small>
              </div>
            </div>
          </div>

          {/* SECCIÓN: Horario Laboral */}
          <div className="config-section">
            <h3>⏰ Horario Laboral de la Clínica</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hora_inicio">
                  <strong>Hora de Inicio</strong>
                </label>
                <input
                  id="hora_inicio"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.hora_inicio}
                  onChange={(e) => handleChange('hora_inicio', parseInt(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="hora_fin">
                  <strong>Hora de Fin</strong>
                </label>
                <input
                  id="hora_fin"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.hora_fin}
                  onChange={(e) => handleChange('hora_fin', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <strong>Días Laborales</strong>
              </label>
              <div className="days-selector">
                {days.map((day, index) => (
                  <label key={index} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.dias_laborales.includes(index)}
                      onChange={() => handleDayToggle(index)}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN: Umbrales Adicionales */}
          <div className="config-section">
            <h3>⚠️ Umbrales Adicionales</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ip_sospechosa_umbral">
                  <strong>IP Sospechosa: Intentos a Usuarios</strong>
                </label>
                <input
                  id="ip_sospechosa_umbral"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.ip_sospechosa_umbral}
                  onChange={(e) =>
                    handleChange('ip_sospechosa_umbral', parseInt(e.target.value))
                  }
                />
                <small>Intentos a diferentes usuarios para marcar como sospechosa</small>
              </div>

              <div className="form-group">
                <label htmlFor="cambios_clave_umbral">
                  <strong>Cambios de Clave: Número</strong>
                </label>
                <input
                  id="cambios_clave_umbral"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.cambios_clave_umbral}
                  onChange={(e) =>
                    handleChange('cambios_clave_umbral', parseInt(e.target.value))
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="ventana_cambios_clave_horas">
                  <strong>en Ventana (horas)</strong>
                </label>
                <input
                  id="ventana_cambios_clave_horas"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.ventana_cambios_clave_horas}
                  onChange={(e) =>
                    handleChange('ventana_cambios_clave_horas', parseInt(e.target.value))
                  }
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN: Notificaciones */}
          <div className="config-section">
            <h3>📧 Notificaciones</h3>

            <div className="form-group checkbox-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={formData.enviar_email_criticas}
                  onChange={(e) => handleChange('enviar_email_criticas', e.target.checked)}
                />
                <span>Enviar email al administrador por alertas CRÍTICAS</span>
              </label>

              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={formData.enviar_reporte_semanal}
                  onChange={(e) =>
                    handleChange('enviar_reporte_semanal', e.target.checked)
                  }
                />
                <span>Enviar email semanal con reporte de seguridad</span>
              </label>

              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={formData.mostrar_notificaciones_dashboard}
                  onChange={(e) =>
                    handleChange('mostrar_notificaciones_dashboard', e.target.checked)
                  }
                />
                <span>Mostrar notificaciones en dashboard</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="correos_adicionales">
                <strong>Correos Adicionales</strong>
              </label>
              <input
                id="correos_adicionales"
                type="text"
                placeholder="ej: supervisor@dentmed.com, seguridad@dentmed.com"
                value={formData.correos_adicionales}
                onChange={(e) => handleChange('correos_adicionales', e.target.value)}
              />
              <small>Separados por comas</small>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleReset}>
            ↻ RESTABLECER
          </button>
          <div>
            <button className="btn btn-secondary" onClick={handleClose}>
              ✕ CANCELAR
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              💾 GUARDAR CONFIGURACIÓN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityConfigModal;
