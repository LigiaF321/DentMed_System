import React, { useEffect, useMemo, useState } from 'react';
import DocumentosTab from './DocumentosTab';
import Odontograma from './Odontograma'; 
import { obtenerPacienteDetalle, actualizarPaciente } from '../../services/pacientes.service';
import './PatientTabs.css';

const TAB_INFO         = 'info';
const TAB_HISTORIAL    = 'historial';
const TAB_TRATAMIENTOS = 'tratamientos';
const TAB_DOCUMENTOS   = 'documentos';

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string') return [];
  return value.split(',').map((i) => i.trim()).filter(Boolean);
};

const getValue = (obj, keys, fallback = '') => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '')
      return obj[key];
  }
  return fallback;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-HN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

const isValidEmail = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized || normalized === 'No registrado') return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};

const formatBirthDate = (value) => {
  if (!value) return '-';
  const normalized = String(value).slice(0, 10);
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ── Resumen de tratamientos (últimos 3) ───────────────────────────────────────
const ResumenTratamientos = ({ pacienteId, onVerTodos }) => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pacienteId) return;
    setLoading(true);
    fetch(`/api/tratamientos/pacientes/${pacienteId}/tratamientos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((r) => r.json())
      .then((d) => setItems((d.tratamientos || []).slice(0, 3)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [pacienteId]);

  return (
    <div style={{ marginTop: 8 }}>
      {loading && <p className="dentista-texto-xpequeno" style={{ color: '#6b7280' }}>Cargando...</p>}
      {!loading && items.length === 0 && (
        <p className="dentista-texto-xpequeno" style={{ color: '#9ca3af', margin: '8px 0' }}>Sin tratamientos registrados.</p>
      )}
      {items.map((t) => (
        <div key={t.id} style={{
          padding: '8px 10px', borderRadius: 8, background: '#f8fafc',
          border: '1px solid #e2e8f0', marginBottom: 6,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div className="dentista-label" style={{ fontWeight: 700, color: '#111827' }}>{t.tipo || t.procedimiento || '-'}</div>
            <div className="dentista-texto-xpequeno" style={{ color: '#6b7280' }}>
              {t.fecha ? new Date(t.fecha).toLocaleDateString() : '-'}
              {t.diente ? ` · Diente ${t.diente}` : ''}
            </div>
          </div>
          <span className="dentista-texto-xpequeno" style={{ fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: t.estado === 'realizado' ? '#dcfce7' : '#fef9c3', color: t.estado === 'realizado' ? '#166534' : '#854d0e' }}>
            {t.estado || 'planificado'}
          </span>
        </div>
      ))}
      <button onClick={onVerTodos} className="dentista-label" style={{ width: '100%', marginTop: 6, padding: '8px 0', borderRadius: 8, border: '1.5px solid #2563eb', background: 'transparent', color: '#2563eb', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseEnter={(e) => { e.target.style.background = '#2563eb'; e.target.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#2563eb'; }}
      >
        <i className="fas fa-external-link-alt" style={{ marginRight: 6 }}></i>
        Ver todos los tratamientos
      </button>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const PatientTabs = ({ paciente, onVerTodos, onVerExpediente, modoPanel = true, onPacienteActualizado }) => {
  const [activeTab,      setActiveTab]      = useState(TAB_INFO);
  const [editModes,      setEditModes]      = useState({
    [TAB_INFO]: false, [TAB_HISTORIAL]: false,
    [TAB_TRATAMIENTOS]: false, [TAB_DOCUMENTOS]: false,
  });
  const [detallePaciente, setDetallePaciente] = useState(null);
  const [loadingDetalle,  setLoadingDetalle]  = useState(false);
  const [notaDocumentos,  setNotaDocumentos]  = useState('');
  const [fieldErrors,     setFieldErrors]     = useState({});
  const [savingInfo,      setSavingInfo]      = useState(false);
  const [savingHistorial, setSavingHistorial] = useState(false);

  // AJUSTE: Mapeo exacto al campo 'id' que vimos en tu tabla de MySQL
  const patientId = useMemo(() => {
    if (!paciente) return null;
    return paciente.id || paciente.id_paciente || paciente.idPaciente || paciente.paciente?.id ||
      (typeof paciente.id === 'number' ? paciente.id : null);
  }, [paciente]);

  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      if (!patientId) { setDetallePaciente(paciente?.paciente || paciente || null); return; }
      setLoadingDetalle(true);
      try {
        const data = await obtenerPacienteDetalle(patientId);
        if (mounted) setDetallePaciente(data);
      } catch {
        if (mounted) setDetallePaciente(paciente?.paciente || paciente || null);
      } finally {
        if (mounted) setLoadingDetalle(false);
      }
    };
    cargar();
    return () => { mounted = false; };
  }, [patientId]);

  useEffect(() => {
    setEditModes({ [TAB_INFO]: false, [TAB_HISTORIAL]: false, [TAB_TRATAMIENTOS]: false, [TAB_DOCUMENTOS]: false });
    setNotaDocumentos('');
    setFieldErrors({});
  }, [patientId]);

  if (!paciente) {
    return (
      <div className="patient-tabs-empty">
        <i className="fas fa-user"></i>
        <p>Seleccione un paciente para ver su información</p>
      </div>
    );
  }

  const source         = detallePaciente || paciente?.paciente || paciente;
  const nombrePaciente = source?.nombre !== undefined
    ? String(source.nombre).trim()
    : getValue(source, ['nombre_completo', 'paciente_nombre'], 'Paciente');

  const infoPersonal = {
    nombre:             getValue(source, ['nombre', 'nombre_completo', 'paciente_nombre']),
    fechaNacimiento:    getValue(source, ['fecha_nacimiento']),
    edad:               getValue(source, ['edad'], '-'),
    sexo:               getValue(source, ['sexo', 'genero'], 'No especificado'),
    email:              getValue(source, ['email', 'correo', 'correo_electronico'], 'No registrado'),
    direccion:          getValue(source, ['direccion'], 'No registrada'),
    telefono:           getValue(source, ['telefono'], 'No registrado'),
    seguroMedico:       getValue(source, ['seguro_medico', 'aseguradora', 'seguro'], 'No registrado'),
    contactoEmergencia: getValue(source, ['contacto_emergencia', 'contacto_emergencia_nombre', 'nombre_contacto_emergencia'], 'No registrado'),
    telefonoEmergencia: getValue(source, ['telefono_emergencia', 'contacto_emergencia_telefono'], 'No registrado'),
  };

  const historialMedico = {
    enfermedades: toArray(getValue(source, ['enfermedades', 'enfermedades_cronicas', 'padecimientos', 'condiciones_cronicas'])),
    medicamentos:  toArray(getValue(source, ['medicamentos', 'medicamentos_actuales'])),
    alergias:      toArray(getValue(source, ['alergias'])),
  };

  const alertasMedicas = [
    ...historialMedico.alergias.map((v) => ({ tipo: 'Alergia', valor: v })),
    ...historialMedico.enfermedades.map((v) => ({ tipo: 'Condición crónica', valor: v })),
  ];

  const ultimaActualizacion = source?.updated_at || source?.updatedAt || source?.fecha_actualizacion || source?.created_at || source?.createdAt;

  const handleSaveInfoPersonal = async () => {
    // Validar que tengamos ID de paciente
    if (!patientId) {
      console.warn('No se encontró ID de paciente para guardar');
      setFieldErrors((prev) => ({ ...prev, general: 'No se puede guardar sin ID de paciente' }));
      return false;
    }
    
    // Validar email
    const emailValue = detallePaciente?.email || '';
    if (!isValidEmail(emailValue)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Ingresa un correo electrónico válido.' }));
      return false; // Error, no guardar
    }
    
    try {
      setSavingInfo(true);
      const datosActualizados = {
        nombre_completo: detallePaciente?.nombre || detallePaciente?.nombre_completo || '',
        email: detallePaciente?.email || '',
        telefono: detallePaciente?.telefono || '',
        direccion: detallePaciente?.direccion || '',
        sexo: detallePaciente?.sexo || '',
        seguro_medico: detallePaciente?.seguro_medico || '',
        contacto_emergencia: detallePaciente?.contacto_emergencia || '',
        telefono_emergencia: detallePaciente?.telefono_emergencia || '',
        fecha_nacimiento: detallePaciente?.fecha_nacimiento || null,
        alergias: detallePaciente?.alergias || '',
      };
      
      await actualizarPaciente(patientId, datosActualizados);
      const freshPaciente = await obtenerPacienteDetalle(patientId);
      setDetallePaciente(freshPaciente);
      onPacienteActualizado?.(freshPaciente);
      setFieldErrors({}); // Limpiar errores si guardó exitosamente
      return true;
    } catch (error) {
      console.error('Error guardando cambios:', error);
      setFieldErrors((prev) => ({ ...prev, general: error.message }));
      return false;
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveHistorialMedico = async () => {
    try {
      setSavingHistorial(true);
      const datosActualizados = {
        enfermedades: detallePaciente?.enfermedades || '',
        medicamentos: detallePaciente?.medicamentos || '',
        alergias: detallePaciente?.alergias || '',
      };
      
      await actualizarPaciente(patientId, datosActualizados);
      const freshPaciente = await obtenerPacienteDetalle(patientId);
      setDetallePaciente(freshPaciente);
      onPacienteActualizado?.(freshPaciente);
      setFieldErrors({}); // Limpiar errores si guardó exitosamente
      return true;
    } catch (error) {
      console.error('Error guardando historial:', error);
      setFieldErrors((prev) => ({ ...prev, general: error.message }));
      return false;
    } finally {
      setSavingHistorial(false);
    }
  };

  const toggleEdit = (tab) => {
    setEditModes((p) => ({ ...p, [tab]: !p[tab] }));
  };

  const handleEditButtonClick = async (tab) => {
    // Si estamos en modo edición, intenta guardar
    if (editModes[tab]) {
      let saved = false;
      if (tab === TAB_INFO) {
        saved = await handleSaveInfoPersonal();
      } else if (tab === TAB_HISTORIAL) {
        saved = await handleSaveHistorialMedico();
      }
      
      // Si se guardó exitosamente, salir del modo edición
      if (saved) {
        toggleEdit(tab);
      }
    } else {
      // Si no estamos editando, entrar en modo edición
      toggleEdit(tab);
    }
  };

  const handleTabChange = async (tab) => {
    if (tab === activeTab) return;
    if (editModes[activeTab]) {
      let saved = false;
      if (activeTab === TAB_INFO) {
        saved = await handleSaveInfoPersonal();
      } else if (activeTab === TAB_HISTORIAL) {
        saved = await handleSaveHistorialMedico();
      }
      if (!saved) return;
      setEditModes((prev) => ({ ...prev, [activeTab]: false }));
    }
    setActiveTab(tab);
  };

  const updateField = (field, value) => setDetallePaciente((p) => {
    const nextState = { ...(p || source), [field]: value };
    if (field === 'nombre') {
      nextState.nombre_completo = value;
    }
    return nextState;
  });

  const handleFieldChange = (field, value) => {
    updateField(field, value);
    setFieldErrors((prev) => ({ ...prev, general: '' }));
    if (field === 'email') {
      const nextError = isValidEmail(value) ? '' : 'Ingresa un correo electrónico válido.';
      setFieldErrors((prev) => ({ ...prev, email: nextError }));
    }
  };

  const renderField = (label, fieldName, canEdit) => {
    // En modo edición, usar el valor directo de detallePaciente sin fallbacks
    // En modo lectura, usar los valores procesados de infoPersonal con fallbacks
    let displayValue, editValue;
    
    if (canEdit) {
      // En edición, usar directamente del estado sin fallbacks
      if (fieldName === 'nombre') {
        editValue = detallePaciente?.nombre ?? detallePaciente?.nombre_completo ?? '';
      } else if (fieldName === 'fecha_nacimiento') {
        editValue = detallePaciente?.fecha_nacimiento ?? '';
      } else {
        editValue = detallePaciente?.[fieldName] ?? '';
      }
      // Para mostrar si no está editando, obtener el valor con fallback
      const fallbacks = {
        nombre: '', fecha_nacimiento: '-', edad: '-', sexo: 'No especificado', email: 'No registrado',
        direccion: 'No registrada', telefono: 'No registrado', seguro_medico: 'No registrado',
        contacto_emergencia: 'No registrado', telefono_emergencia: 'No registrado',
      };
      displayValue = fieldName === 'fecha_nacimiento'
        ? formatBirthDate(editValue)
        : (editValue || fallbacks[fieldName] || '-');
    } else {
      // En lectura, usar los valores con fallbacks desde infoPersonal
      const fieldMapping = {
        nombre: 'nombre', fecha_nacimiento: 'fechaNacimiento', edad: 'edad', sexo: 'sexo', email: 'email',
        direccion: 'direccion', telefono: 'telefono', seguro_medico: 'seguroMedico',
        contacto_emergencia: 'contactoEmergencia', telefono_emergencia: 'telefonoEmergencia',
      };
      const displayKey = fieldMapping[fieldName];
      displayValue = fieldName === 'fecha_nacimiento'
        ? formatBirthDate(infoPersonal[displayKey])
        : (infoPersonal[displayKey] || '-');
      if (displayValue === 'No registrado' || displayValue === 'No registrada' || displayValue === 'No especificado') {
        displayValue = '-';
      }
    }
    
    return (
      <div className={`info-field ${fieldErrors[fieldName] ? 'has-error' : ''}`} key={label}>
        <span className="info-label dentista-label">{label}</span>
        {canEdit
          ? (
            <>
              {fieldName === 'sexo' ? (
                <select
                  className={`info-input ${fieldErrors[fieldName] ? 'input-error' : ''}`}
                  value={editValue}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              ) : fieldName === 'fecha_nacimiento' ? (
                <input
                  className={`info-input ${fieldErrors[fieldName] ? 'input-error' : ''}`}
                  type="date"
                  value={editValue}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                />
              ) : (
                <input
                  className={`info-input ${fieldErrors[fieldName] ? 'input-error' : ''}`}
                  type={fieldName === 'email' ? 'email' : 'text'}
                  value={editValue}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  readOnly={fieldName === 'edad'}
                />
              )}
              {fieldErrors[fieldName] ? <span className="info-error">{fieldErrors[fieldName]}</span> : null}
            </>
          )
          : <span className="info-value">{displayValue}</span>}
      </div>
    );
  };

  const BtnVerExpediente = () => {
    if (!modoPanel) return null;
    return (
      <button
        onClick={onVerExpediente}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white',
          fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 6px 16px rgba(37,99,235,0.18)', marginTop: 12,
        }}
      >
        <i className="fas fa-folder-open"></i> Ver expediente completo
      </button>
    );
  };

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
        <button className={`tab-btn ${activeTab === TAB_INFO           ? 'active' : ''}`} onClick={() => handleTabChange(TAB_INFO)}>
          <i className="fas fa-id-card"></i> Info Personal
        </button>
        <button className={`tab-btn ${activeTab === TAB_HISTORIAL    ? 'active' : ''}`} onClick={() => handleTabChange(TAB_HISTORIAL)}>
          <i className="fas fa-heartbeat"></i> Historial Médico
        </button>
        <button className={`tab-btn ${activeTab === TAB_TRATAMIENTOS ? 'active' : ''}`} onClick={() => handleTabChange(TAB_TRATAMIENTOS)}>
          <i className="fas fa-tooth"></i> Tratamientos
        </button>
        <button className={`tab-btn ${activeTab === TAB_DOCUMENTOS   ? 'active' : ''}`} onClick={() => handleTabChange(TAB_DOCUMENTOS)}>
          <i className="fas fa-file-medical"></i> Documentos
        </button>
      </div>

      <div className="tabs-content">
        {loadingDetalle ? <div className="tab-loading">Cargando expediente del paciente...</div> : null}

        {/* ── Info Personal ── */}
        {activeTab === TAB_INFO && (
          <div className="tab-pane">
            <div className="tab-toolbar">
              <h4>Información Personal</h4>
              {!modoPanel && (
                <button className="tab-edit-btn" onClick={() => handleEditButtonClick(TAB_INFO)} disabled={savingInfo}>
                  {savingInfo ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-pen"></i> {editModes[TAB_INFO] ? 'Finalizar' : 'Editar'}
                    </>
                  )}
                </button>
              )}
            </div>

            {alertasMedicas.length > 0 ? (
              <div className="medical-alert-banner">
                <div className="medical-alert-title"><i className="fas fa-exclamation-triangle"></i> Alertas médicas</div>
                <div className="medical-alert-items">
                  {alertasMedicas.map((a, i) => <span key={i}>{a.tipo}: {a.valor}</span>)}
                </div>
              </div>
            ) : (
              <div className="medical-alert-empty">Sin alertas médicas críticas registradas.</div>
            )}

            {fieldErrors.general && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {fieldErrors.general}
              </div>
            )}

            <div className="info-grid">
              {renderField('Nombre', 'nombre', !modoPanel && editModes[TAB_INFO])}
              {renderField('Fecha de nacimiento', 'fecha_nacimiento', !modoPanel && editModes[TAB_INFO])}
              {renderField('Edad', 'edad', false)}
              {renderField('Sexo', 'sexo', !modoPanel && editModes[TAB_INFO])}
              {renderField('Correo electrónico', 'email', !modoPanel && editModes[TAB_INFO])}
              {renderField('Teléfono', 'telefono', !modoPanel && editModes[TAB_INFO])}
              {renderField('Dirección', 'direccion', !modoPanel && editModes[TAB_INFO])}
              {renderField('Seguro médico', 'seguro_medico', !modoPanel && editModes[TAB_INFO])}
              {!modoPanel && renderField('Contacto emergencia', 'contacto_emergencia', editModes[TAB_INFO])}
              {!modoPanel && renderField('Teléfono emergencia', 'telefono_emergencia', editModes[TAB_INFO])}
            </div>
            <BtnVerExpediente />
          </div>
        )}

        {/* ── Historial Médico ── */}
        {activeTab === TAB_HISTORIAL && (
          <div className="tab-pane">
            <div className="tab-toolbar">
              <h4>Historial Médico</h4>
            </div>
            <div className="history-grid">
              <div className="history-card">
                <h5>Enfermedades</h5>
                {!modoPanel && editModes[TAB_HISTORIAL]
                  ? <textarea className="history-input" value={historialMedico.enfermedades.join(', ')} onChange={(e) => updateField('enfermedades', e.target.value)} />
                  : historialMedico.enfermedades.length > 0
                    ? historialMedico.enfermedades.map((item, i) => <span key={i} className="history-chip">{item}</span>)
                    : <p className="history-empty">Sin registros</p>}
              </div>
              <div className="history-card">
                <h5>Medicamentos</h5>
                {!modoPanel && editModes[TAB_HISTORIAL]
                  ? <textarea className="history-input" value={historialMedico.medicamentos.join(', ')} onChange={(e) => updateField('medicamentos', e.target.value)} />
                  : historialMedico.medicamentos.length > 0
                    ? historialMedico.medicamentos.map((item, i) => <span key={i} className="history-chip">{item}</span>)
                    : <p className="history-empty">Sin registros</p>}
              </div>
              <div className="history-card">
                <h5>Alergias</h5>
                {!modoPanel && editModes[TAB_HISTORIAL]
                  ? <textarea className="history-input" value={historialMedico.alergias.join(', ')} onChange={(e) => updateField('alergias', e.target.value)} />
                  : historialMedico.alergias.length > 0
                    ? historialMedico.alergias.map((item, i) => <span key={i} className="history-chip danger">{item}</span>)
                    : <p className="history-empty">Sin registros</p>}
              </div>
            </div>
            <BtnVerExpediente />
          </div>
        )}

        {/* ── Tratamientos (Integrado con Odontograma) ── */}
        {activeTab === TAB_TRATAMIENTOS && (
          <div className="tab-pane">
            <div className="tab-toolbar">
              <h4>Tratamientos y Odontograma</h4>
            </div>
            
            <div style={{ marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
               <Odontograma 
                 pacienteId={patientId} 
                 pacienteNombre={nombrePaciente}
                 // AJUSTE: Pasamos 'tipo' preventivamente si el componente lo usa como prop
                 tipoTratamiento="Odontograma" 
                 onGuardar={() => {
                   if (patientId) obtenerPacienteDetalle(patientId).then(setDetallePaciente);
                 }} 
               />
            </div>

            <h5 style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>Historial Reciente</h5>
            <ResumenTratamientos
              pacienteId={patientId}
              onVerTodos={onVerTodos}
            />
            <BtnVerExpediente />
          </div>
        )}

        {/* ── Documentos ── */}
        {activeTab === TAB_DOCUMENTOS && (
          <div className="tab-pane">
            <div className="tab-toolbar">
              <h4>Documentos y Radiografías</h4>
            </div>
            {modoPanel ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: 8, border: '1px dashed #e5e7eb' }}>
                <i className="fas fa-file-medical" style={{ fontSize: 24, marginBottom: 8, display: 'block', opacity: 0.4 }}></i>
                <p style={{ margin: 0, fontSize: 12 }}>Los documentos y radiografías se gestionan desde el expediente completo.</p>
              </div>
            ) : (
              <>
                {editModes[TAB_DOCUMENTOS] ? (
                  <div className="tab-quick-edit">
                    <label>Campo rápido: observaciones de documentos</label>
                    <textarea value={notaDocumentos} onChange={(e) => setNotaDocumentos(e.target.value)} placeholder="Ejemplo: pendiente cargar radiografía panorámica y consentimiento firmado." />
                  </div>
                ) : notaDocumentos ? (
                  <div className="tab-quick-preview">{notaDocumentos}</div>
                ) : null}
                <div className="documentos-embedded">
                  <DocumentosTab paciente={source} />
                </div>
              </>
            )}
            <BtnVerExpediente />
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTabs;


