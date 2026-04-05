import React, { useEffect, useMemo, useState } from 'react';
import TreatmentHistory from './TreatmentHistory';
import DocumentosTab from './DocumentosTab';
import { obtenerPacienteDetalle } from '../../services/pacientes.service';
import './PatientTabs.css';

const TAB_INFO = 'info';
const TAB_HISTORIAL = 'historial';
const TAB_TRATAMIENTOS = 'tratamientos';
const TAB_DOCUMENTOS = 'documentos';

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const getValue = (obj, keys, fallback = '') => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
      return obj[key];
    }
  }
  return fallback;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PatientTabs = ({ paciente }) => {
  const [activeTab, setActiveTab] = useState(TAB_INFO);
  const [editModes, setEditModes] = useState({
    [TAB_INFO]: false,
    [TAB_HISTORIAL]: false,
    [TAB_TRATAMIENTOS]: false,
    [TAB_DOCUMENTOS]: false,
  });
  const [detallePaciente, setDetallePaciente] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [notaTratamientos, setNotaTratamientos] = useState('');
  const [notaDocumentos, setNotaDocumentos] = useState('');

  const patientId = useMemo(() => {
    if (!paciente) return null;
    return (
      paciente.id_paciente ||
      paciente.idPaciente ||
      paciente.paciente?.id ||
      (typeof paciente.id === 'number' ? paciente.id : null)
    );
  }, [paciente]);

  useEffect(() => {
    let mounted = true;

    const cargarDetalle = async () => {
      if (!patientId) {
        setDetallePaciente(paciente?.paciente || paciente || null);
        return;
      }

      setLoadingDetalle(true);
      try {
        const data = await obtenerPacienteDetalle(patientId);
        if (mounted) {
          setDetallePaciente(data);
        }
      } catch (error) {
        if (mounted) {
          setDetallePaciente(paciente?.paciente || paciente || null);
        }
      } finally {
        if (mounted) {
          setLoadingDetalle(false);
        }
      }
    };

    cargarDetalle();

    return () => {
      mounted = false;
    };
  }, [patientId, paciente]);

  useEffect(() => {
    setEditModes({
      [TAB_INFO]: false,
      [TAB_HISTORIAL]: false,
      [TAB_TRATAMIENTOS]: false,
      [TAB_DOCUMENTOS]: false,
    });
    setNotaTratamientos('');
    setNotaDocumentos('');
  }, [patientId]);

  if (!paciente) {
    return (
      <div className="patient-tabs-empty">
        <i className="fas fa-user"></i>
        <p>Seleccione un paciente para ver su información</p>
      </div>
    );
  }

  const source = detallePaciente || paciente?.paciente || paciente;
  const nombrePaciente = getValue(source, ['nombre_completo', 'paciente_nombre', 'nombre'], 'Paciente');

  const infoPersonal = {
    nombre: nombrePaciente,
    edad: getValue(source, ['edad'], '-'),
    sexo: getValue(source, ['sexo', 'genero'], 'No especificado'),
    direccion: getValue(source, ['direccion'], 'No registrada'),
    telefono: getValue(source, ['telefono'], 'No registrado'),
    seguroMedico: getValue(source, ['seguro_medico', 'aseguradora', 'seguro'], 'No registrado'),
    contactoEmergencia: getValue(
      source,
      ['contacto_emergencia', 'contacto_emergencia_nombre', 'nombre_contacto_emergencia'],
      'No registrado'
    ),
    telefonoEmergencia: getValue(
      source,
      ['telefono_emergencia', 'contacto_emergencia_telefono'],
      'No registrado'
    ),
  };

  const historialMedico = {
    enfermedades: toArray(
      getValue(source, ['enfermedades', 'enfermedades_cronicas', 'padecimientos', 'condiciones_cronicas'])
    ),
    medicamentos: toArray(getValue(source, ['medicamentos', 'medicamentos_actuales'])),
    alergias: toArray(getValue(source, ['alergias'])),
  };

  const alertasMedicas = [
    ...historialMedico.alergias.map((item) => ({ tipo: 'Alergia', valor: item })),
    ...historialMedico.enfermedades.map((item) => ({ tipo: 'Condición crónica', valor: item })),
  ];

  const ultimaActualizacion =
    source?.updated_at || source?.updatedAt || source?.fecha_actualizacion || source?.created_at || source?.createdAt;

  const toggleEdit = (tab) => {
    setEditModes((prev) => ({
      ...prev,
      [tab]: !prev[tab],
    }));
  };

  const updateField = (field, value) => {
    setDetallePaciente((prev) => ({
      ...(prev || source),
      [field]: value,
    }));
  };

  const renderField = (label, value, fieldName, canEdit) => (
    <div className="info-field" key={label}>
      <span className="info-label">{label}</span>
      {canEdit ? (
        <input
          className="info-input"
          value={value || ''}
          onChange={(e) => updateField(fieldName, e.target.value)}
        />
      ) : (
        <span className="info-value">{value || '-'}</span>
      )}
    </div>
  );

  return (
    <div className="patient-tabs">
      <div className="patient-summary-header">
        <div>
          <h3>Expediente Unificado</h3>
          <p>{nombrePaciente}</p>
        </div>
        <div className="patient-last-update">
          <i className="fas fa-clock"></i>
          Última actualización: {formatDateTime(ultimaActualizacion)}
        </div>
      </div>

      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === TAB_INFO ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_INFO)}
        >
          <i className="fas fa-id-card"></i> Info Personal
        </button>

        <button
          className={`tab-btn ${activeTab === TAB_HISTORIAL ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_HISTORIAL)}
        >
          <i className="fas fa-heartbeat"></i> Historial Médico
        </button>

        <button
          className={`tab-btn ${activeTab === TAB_TRATAMIENTOS ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_TRATAMIENTOS)}
        >
          <i className="fas fa-tooth"></i> Tratamientos
        </button>

        <button
          className={`tab-btn ${activeTab === TAB_DOCUMENTOS ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_DOCUMENTOS)}
        >
          <i className="fas fa-file-medical"></i> Documentos
        </button>
      </div>

      <div className="tabs-content">
        {loadingDetalle ? (
          <div className="tab-loading">Cargando expediente del paciente...</div>
        ) : null}

        {activeTab === TAB_INFO && (
          <div className="tab-pane">
            <div className="tab-toolbar">
              <h4>Información Personal</h4>
              <button className="tab-edit-btn" onClick={() => toggleEdit(TAB_INFO)}>
                <i className="fas fa-pen"></i> {editModes[TAB_INFO] ? 'Finalizar' : 'Editar'}
              </button>
            </div>

            {alertasMedicas.length > 0 ? (
              <div className="medical-alert-banner">
                <div className="medical-alert-title">
                  <i className="fas fa-exclamation-triangle"></i> Alertas médicas
                </div>
                <div className="medical-alert-items">
                  {alertasMedicas.map((alerta, index) => (
                    <span key={`${alerta.tipo}-${alerta.valor}-${index}`}>
                      {alerta.tipo}: {alerta.valor}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="medical-alert-empty">Sin alertas médicas críticas registradas.</div>
            )}

            <div className="info-grid">
              {renderField('Nombre', infoPersonal.nombre, 'nombre', editModes[TAB_INFO])}
              {renderField('Edad', String(infoPersonal.edad), 'edad', editModes[TAB_INFO])}
              {renderField('Sexo', infoPersonal.sexo, 'sexo', editModes[TAB_INFO])}
              {renderField('Dirección', infoPersonal.direccion, 'direccion', editModes[TAB_INFO])}
              {renderField('Teléfono', infoPersonal.telefono, 'telefono', editModes[TAB_INFO])}
              {renderField('Seguro médico', infoPersonal.seguroMedico, 'seguro_medico', editModes[TAB_INFO])}
              {renderField(
                'Contacto emergencia',
                infoPersonal.contactoEmergencia,
                'contacto_emergencia',
                editModes[TAB_INFO]
              )}
              {renderField(
                'Teléfono emergencia',
                infoPersonal.telefonoEmergencia,
                'telefono_emergencia',
                editModes[TAB_INFO]
              )}
            </div>
          </div>
        )}

        {activeTab === TAB_HISTORIAL && (
          <div className="tab-pane">
            <div className="tab-toolbar">
              <h4>Historial Médico</h4>
              <button className="tab-edit-btn" onClick={() => toggleEdit(TAB_HISTORIAL)}>
                <i className="fas fa-pen"></i> {editModes[TAB_HISTORIAL] ? 'Finalizar' : 'Editar'}
              </button>
            </div>

            <div className="history-grid">
              <div className="history-card">
                <h5>Enfermedades</h5>
                {editModes[TAB_HISTORIAL] ? (
                  <textarea
                    className="history-input"
                    value={historialMedico.enfermedades.join(', ')}
                    onChange={(e) => updateField('enfermedades', e.target.value)}
                  />
                ) : historialMedico.enfermedades.length > 0 ? (
                  historialMedico.enfermedades.map((item, index) => (
                    <span key={`${item}-${index}`} className="history-chip">{item}</span>
                  ))
                ) : (
                  <p className="history-empty">Sin registros</p>
                )}
              </div>

              <div className="history-card">
                <h5>Medicamentos</h5>
                {editModes[TAB_HISTORIAL] ? (
                  <textarea
                    className="history-input"
                    value={historialMedico.medicamentos.join(', ')}
                    onChange={(e) => updateField('medicamentos', e.target.value)}
                  />
                ) : historialMedico.medicamentos.length > 0 ? (
                  historialMedico.medicamentos.map((item, index) => (
                    <span key={`${item}-${index}`} className="history-chip">{item}</span>
                  ))
                ) : (
                  <p className="history-empty">Sin registros</p>
                )}
              </div>

              <div className="history-card">
                <h5>Alergias</h5>
                {editModes[TAB_HISTORIAL] ? (
                  <textarea
                    className="history-input"
                    value={historialMedico.alergias.join(', ')}
                    onChange={(e) => updateField('alergias', e.target.value)}
                  />
                ) : historialMedico.alergias.length > 0 ? (
                  historialMedico.alergias.map((item, index) => (
                    <span key={`${item}-${index}`} className="history-chip danger">{item}</span>
                  ))
                ) : (
                  <p className="history-empty">Sin registros</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === TAB_TRATAMIENTOS && (
          <div className="tab-pane">
            <div className="tab-toolbar">
              <h4>Tratamientos Realizados</h4>
              <button className="tab-edit-btn" onClick={() => toggleEdit(TAB_TRATAMIENTOS)}>
                <i className="fas fa-pen"></i> {editModes[TAB_TRATAMIENTOS] ? 'Finalizar' : 'Editar'}
              </button>
            </div>

            {editModes[TAB_TRATAMIENTOS] ? (
              <div className="tab-quick-edit">
                <label>Campo rápido: observaciones de tratamientos</label>
                <textarea
                  value={notaTratamientos}
                  onChange={(e) => setNotaTratamientos(e.target.value)}
                  placeholder="Ejemplo: priorizar revisión de tratamiento pendiente en próxima cita."
                />
              </div>
            ) : notaTratamientos ? (
              <div className="tab-quick-preview">{notaTratamientos}</div>
            ) : null}

            <TreatmentHistory pacienteId={patientId || paciente?.id} />
          </div>
        )}

        {activeTab === TAB_DOCUMENTOS && (
          <div className="tab-pane">
            <div className="tab-toolbar">
              <h4>Documentos y Radiografías</h4>
              <button className="tab-edit-btn" onClick={() => toggleEdit(TAB_DOCUMENTOS)}>
                <i className="fas fa-pen"></i> {editModes[TAB_DOCUMENTOS] ? 'Finalizar' : 'Editar'}
              </button>
            </div>

            {editModes[TAB_DOCUMENTOS] ? (
              <div className="tab-quick-edit">
                <label>Campo rápido: observaciones de documentos</label>
                <textarea
                  value={notaDocumentos}
                  onChange={(e) => setNotaDocumentos(e.target.value)}
                  placeholder="Ejemplo: pendiente cargar radiografía panorámica y consentimiento firmado."
                />
              </div>
            ) : notaDocumentos ? (
              <div className="tab-quick-preview">{notaDocumentos}</div>
            ) : null}

            <div className="documentos-embedded">
              <DocumentosTab paciente={source} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTabs;