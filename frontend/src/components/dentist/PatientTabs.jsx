// frontend/src/components/dentist/PatientTabs.jsx

import React, { useState } from 'react';
import TreatmentHistory from './TreatmentHistory';
import DocumentosTab from './DocumentosTab';
import './PatientTabs.css';

const PatientTabs = ({ paciente }) => {
  const [activeTab, setActiveTab] = useState('historia');

  if (!paciente) {
    return (
      <div className="patient-tabs-empty">
        <i className="fas fa-user"></i>
        <p>Seleccione un paciente para ver su información</p>
      </div>
    );
  }

  const planTratamientosData = [
    { prioridad: 'Alta', tratamiento: 'Endodoncia muela #16', fechaPropuesta: '05/04/2026' },
    { prioridad: 'Media', tratamiento: 'Obturación diente #45', fechaPropuesta: '12/04/2026' },
    { prioridad: 'Baja', tratamiento: 'Blanqueamiento dental', fechaPropuesta: '20/04/2026' },
  ];

  const notasData = [
    { fecha: '25/03/2026', nota: 'Paciente reporta sensibilidad al frío', autor: 'Dra. Ligia' },
    { fecha: '20/03/2026', nota: 'Se recomienda cepillado más frecuente', autor: 'Dr. Juan Pérez' },
    { fecha: '15/03/2026', nota: 'Paciente cumple con el tratamiento', autor: 'Dr. Juan Pérez' },
  ];

  return (
    <div className="patient-tabs">
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'historia' ? 'active' : ''}`}
          onClick={() => setActiveTab('historia')}
        >
          <i className="fas fa-history"></i> Historia
        </button>

        <button
          className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          <i className="fas fa-clipboard-list"></i> Plan de Tratamientos
        </button>

        <button
          className={`tab-btn ${activeTab === 'notas' ? 'active' : ''}`}
          onClick={() => setActiveTab('notas')}
        >
          <i className="fas fa-sticky-note"></i> Notas
        </button>

        <button
          className={`tab-btn ${activeTab === 'documentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('documentos')}
        >
          <i className="fas fa-file-image"></i> Documentos
        </button>
      </div>

      <div className="tabs-content">
        {activeTab === 'historia' && (
          <div className="tab-pane">
            <TreatmentHistory pacienteId={paciente?.id} />
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="tab-pane">
            <div className="plan-header">
              <span>Prioridad</span>
              <span>Tratamiento</span>
              <span>Fecha Propuesta</span>
            </div>
            {planTratamientosData.map((item, index) => (
              <div key={index} className="plan-item">
                <span className={`plan-prioridad prioridad-${item.prioridad.toLowerCase()}`}>
                  {item.prioridad}
                </span>
                <span className="plan-tratamiento">{item.tratamiento}</span>
                <span className="plan-fecha">{item.fechaPropuesta}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notas' && (
          <div className="tab-pane">
            {notasData.map((item, index) => (
              <div key={index} className="nota-item">
                <div className="nota-fecha">
                  <i className="fas fa-calendar-day"></i> {item.fecha}
                </div>
                <div className="nota-texto">{item.nota}</div>
                <div className="nota-autor">
                  <i className="fas fa-user"></i> {item.autor}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="tab-pane">
            <DocumentosTab paciente={paciente} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTabs;