import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

// Modal para cambio rápido de consultorio (fuera del componente principal)
function CambioConsultorioModal({ cita, consultorios, citasDentista, onClose, onUpdated }) {
  const [nuevoConsultorio, setNuevoConsultorio] = React.useState(cita.id_consultorio ? String(cita.id_consultorio) : '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  // Validar disponibilidad y conflictos
  const validarCambio = async (idConsultorio) => {
    setError('');
    if (!idConsultorio) return false;
    // Validar conflicto con otras citas del dentista
    const inicio = new Date(cita.fecha_hora);
    const fin = new Date(inicio.getTime() + Number(cita.duracion_estimada || 30) * 60000);
    const conflicto = (citasDentista || []).find((c) => {
      if (c.id === cita.id) return false;
      if (!c.fecha_hora || !c.duracion_estimada) return false;
      const inicioC = new Date(c.fecha_hora);
      const finC = new Date(inicioC.getTime() + Number(c.duracion_estimada) * 60000);
      return (
        c.id_consultorio && String(c.id_consultorio) === String(idConsultorio) &&
        ((inicio < finC && fin > inicioC))
      );
    });
    if (conflicto) {
      setError('Conflicto: Ya existe una cita en este consultorio en ese horario.');
      return false;
    }
    // Validar disponibilidad (API)
    try {
      const res = await verificarDisponibilidad({
        fecha: cita.fecha_hora.split('T')[0],
        hora: cita.fecha_hora.split('T')[1]?.slice(0,5),
        duracion: cita.duracion_estimada,
        id_consultorio: idConsultorio,
      });
      if (!res.disponible) {
        setError(res.message || 'No disponible en ese horario.');
        return false;
      }
    } catch (err) {
      setError('No se pudo verificar disponibilidad.');
      return false;
    }
    setError('');
    return true;
  };

  const handleGuardar = async () => {
    if (String(nuevoConsultorio) === String(cita.id_consultorio)) {
      setError('Selecciona un consultorio diferente.');
      return;
    }
    setSaving(true);
    const valido = await validarCambio(nuevoConsultorio);
    if (!valido) {
      setSaving(false);
      return;
    }
    // Actualizar cita (simulación, deberías llamar a tu API real de update)
    try {
      // Aquí deberías hacer un fetch/axios PUT a /api/citas/:id para actualizar el consultorio
      // Simulación:
      const citaActualizada = { ...cita, id_consultorio: Number(nuevoConsultorio) };
      // Registrar auditoría de cambio de consultorio
      try {
        await registrarAuditoriaConsultorio({
          accion: "cambio_consultorio",
          modulo: "Consultorios",
          detalle: `Cambio de consultorio para cita ${cita.id}: de ${cita.id_consultorio} a ${nuevoConsultorio}`,
          resultado: "exito",
          id_usuario: cita.id_dentista || null,
          metadatos: {
            id_cita: cita.id,
            id_paciente: cita.id_paciente,
            consultorio_anterior: cita.id_consultorio,
            consultorio_nuevo: nuevoConsultorio,
            fecha: cita.fecha_hora,
          },
        });
      } catch (err) {
        // No bloquear el cambio si falla la auditoría
        console.warn("No se pudo registrar auditoría de consultorio", err);
      }
      setSuccess('Consultorio actualizado correctamente.');
      setTimeout(() => {
        onUpdated(citaActualizada);
      }, 1000);
    } catch (err) {
      setError('No se pudo actualizar la cita.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeft: '4px solid #2563eb' }}>
          <h3>Cambiar consultorio</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p><strong>Paciente:</strong> {cita.paciente_nombre || cita.paciente?.nombre || 'Paciente'}</p>
          <p><strong>Fecha:</strong> {new Date(cita.fecha_hora).toLocaleString()}</p>
          <div className="dm17-field">
            <label>Nuevo consultorio</label>
            <select value={nuevoConsultorio} onChange={e => setNuevoConsultorio(e.target.value)} disabled={saving}>
              <option value="">Seleccione</option>
              {consultorios.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.nombre} {c.equipamiento ? `- ${c.equipamiento.join(', ')}` : ''} {c.estado === 'Mantenimiento' ? '(Mantenimiento)' : ''}
                </option>
              ))}
            </select>
          </div>
          {error && <div className="dm17-error" style={{ marginTop: 8 }}>{error}</div>}
          {success && <div className="dm17-success" style={{ marginTop: 8 }}>{success}</div>}
        </div>
        <div className="modal-footer">
          <button className="dm17-btn dm17-btn-primary" onClick={handleGuardar} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="dm17-btn dm17-btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

  const mostrarToast = (mensaje) => {
    setToastMessage(mensaje);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const obtenerPacienteNombre = (cita) => cita.paciente_nombre || cita.paciente?.nombre || 'Paciente';

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const handleNuevaCitaCreada = (response) => {
    const nuevaCita = response.data;
    const fechaNuevaCita = new Date(nuevaCita.fecha_hora);
    setCitas((prev) => {
      const actualizadas = ordenarCitasPorFecha([...prev, nuevaCita]);
      setMetrics(calcularMetricas(actualizadas));
      return actualizadas;
    });
    setAgendaDate(fechaNuevaCita);
    setSelectedCita(nuevaCita);
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(fechaNuevaCita);
    }
    mostrarToast('Cita creada correctamente');
  };

  const handleSelectCita = (cita) => {
    setSelectedCita(cita);
    setAgendaDate(new Date(cita.fecha_hora));
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(new Date(cita.fecha_hora));
    }
  };

  const handleEventClick = (info) => {
    const isBloqueo = info.event.extendedProps.isBloqueo;
    setSelectedEvent(info.event);
    setShowModal(true);

    if (!isBloqueo) {
      const cita = citas.find((c) => String(c.id) === String(info.event.id));
      if (cita) handleSelectCita(cita);
    }
  };

  const handleDateClick = (info) => setAgendaDate(new Date(info.date));
  
  const handleViewChange = (view) => {
    setCurrentView(view);
    if (calendarRef.current) calendarRef.current.getApi().changeView(view);
  };

  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleNext = () => calendarRef.current?.getApi().next();
  const handleToday = () => {
    setAgendaDate(new Date());
    calendarRef.current?.getApi().today();
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  useEffect(() => {
    const fetchDentistaInfo = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/dentistas/perfil', { headers: getAuthHeaders() });
        if (response.ok) {
          const data = await response.json();
          setDentistaInfo(data);
        } else {
          setDentistaInfo({ nombre: 'Usuario', id: 1 });
        }
      } catch (error) { 
        setDentistaInfo({ nombre: 'Usuario', id: 1 });
      }
    };
    fetchDentistaInfo();
  }, []);

  useEffect(() => {
    const fetchConsultorios = async () => {
      try {
        const response = await obtenerConsultorios();
        setConsultorios(response.data || []);
      } catch (error) { setConsultorios([]); }
    };
    fetchConsultorios();
  }, []);

  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/citas/dentista', { headers: getAuthHeaders() });
        if (response.ok) {
          const data = await response.json();
          const citasOrdenadas = ordenarCitasPorFecha(data);
          setCitas(citasOrdenadas);
          setMetrics(calcularMetricas(citasOrdenadas));
        }
      } catch (error) { console.error('Error obteniendo citas:', error); }
      finally { setLoading(false); }
    };
    fetchCitas();
  }, []);

  useEffect(() => {
    if (dentistaInfo?.id) fetchBloques();
  }, [dentistaInfo]);

  const eventsToDisplay = [
    ...(Array.isArray(citas) ? citas : []).map((cita) => {
      const estado = normalizarEstado(cita.estado);
      return {
        id: String(cita.id),
        title: obtenerPacienteNombre(cita),
        start: cita.fecha_hora,
        end: obtenerFechaFin(cita),
        extendedProps: { estado, motivo: cita.motivo, isBloqueo: false },
        backgroundColor: estadoColores[estado]?.background || '#007bff',
        borderColor: estadoColores[estado]?.border || '#0069d9',
        textColor: '#ffffff',
      };
    }),
    ...(Array.isArray(bloques) ? bloques : []).map((bloque) => ({
      id: `bloque-${bloque.id}`,
      title: `BLOQUEO: ${bloque.tipo.toUpperCase()}`,
      start: bloque.fecha_inicio,
      end: bloque.fecha_fin,
      className: 'event-bloqueo',
      extendedProps: { 
        isBloqueo: true, 
        idOriginal: bloque.id,
        descripcion: bloque.descripcion,
        tipo: bloque.tipo 
      },
      backgroundColor: '#9b59b6',
      borderColor: '#8e44ad',
      textColor: '#ffffff',
    }))
  ];

  // El return de loading debe estar aquí, dentro del cuerpo del componente
  if (loading) {
    return (
      <div className="dentista-loading">
        <div className="loading-spinner"></div>
        <p>Cargando tu calendario...</p>
      </div>
    );
  }

  const citasAgendaSeleccionada = ordenarCitasPorFecha(citas.filter((cita) => esMismoDia(cita.fecha_hora, agendaDate)));

  const renderContent = () => {
    switch (activeView) {
      case 'agenda':
        return (
          <>
            <MetricCards {...metrics} />
            <div className="dashboard-two-columns">
              <div className="dashboard-left-column">
                <div className="calendar-controls">
                  <div className="nav-buttons">
                    <button className="nav-btn" onClick={handlePrev}><i className="fas fa-chevron-left"></i> ANTERIOR</button>
                    <button className="nav-btn today-btn" onClick={handleToday}><i className="fas fa-calendar-day"></i> HOY</button>
                    <button className="nav-btn" onClick={handleNext}>SIGUIENTE <i className="fas fa-chevron-right"></i></button>
                  </div>
                  <div className="view-buttons">
                    <button className={`view-btn ${currentView === 'timeGridDay' ? 'active' : ''}`} onClick={() => handleViewChange('timeGridDay')}>DÍA</button>
                    <button className={`view-btn ${currentView === 'timeGridWeek' ? 'active' : ''}`} onClick={() => handleViewChange('timeGridWeek')}>SEMANA</button>
                    <button className={`view-btn ${currentView === 'dayGridMonth' ? 'active' : ''}`} onClick={() => handleViewChange('dayGridMonth')}>MES</button>
                  </div>
                </div>

                <div className="calendar-wrapper">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    headerToolbar={false}
                    initialView={currentView}
                    events={eventsToDisplay}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    slotMinTime={startHour}
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
                    locale="es"
                    height="auto"
                  />
                </div>
              </div>
              <div className="dashboard-right-column">
                <AppointmentsList citas={citasAgendaSeleccionada} onSelectCita={handleSelectCita} selectedCitaId={selectedCita?.id} selectedDate={agendaDate} />
                <Odontograma paciente={selectedCita} />
                <PatientTabs paciente={selectedCita} />
              </div>
            </div>
          </>
        );
      default:
        return <div className="placeholder-content"><h2>{activeView.toUpperCase()}</h2><p>Contenido en desarrollo...</p></div>;
    }
  };

  return (
    <div className="dentist-dashboard-layout">
      <DentistSidebar activeView={activeView} onSelectView={setActiveView} onLogout={onLogout} />
      <main className="dentist-main-content">
        <div className="dentist-topbar">
          <div className="dentist-topbar-left">
            <div className="doctor-name-topbar">
              <i className="fas fa-user-md"></i>
              <span>Dr. {dentistaInfo?.nombre || 'Cargando...'}</span>
            </div>
          </div>
          <div className="dentist-topbar-right">
            <button className="btn-bloquear-horario" onClick={() => setShowBloqueoModal(true)}>
              <i className="fas fa-lock"></i> Bloquear horario
            </button>
            <button className="new-appointment-btn" onClick={() => setShowNuevaCitaModal(true)}>+ Nueva cita</button>
          </div>
        </div>
        {renderContent()}
      </main>

      {toastMessage && <div className="dentist-toast-success">{toastMessage}</div>}

      <NuevaCitaModal open={showNuevaCitaModal} onClose={() => setShowNuevaCitaModal(false)} onCreated={handleNuevaCitaCreada} consultorios={consultorios} citasDentista={citas} />
      
      <BloqueoModal 
        isOpen={showBloqueoModal} 
        onClose={() => setShowBloqueoModal(false)} 
        onSave={handleSaveBloqueo} 
        idDentista={dentistaInfo?.id} 
      />

      {showModal && selectedEvent && !selectedEvent.extendedProps.isBloqueo && (
        <CambioConsultorioModal
          cita={citas.find((c) => String(c.id) === String(selectedEvent.id))}
          consultorios={consultorios}
          citasDentista={citas}
          onClose={closeModal}
          onUpdated={(citaActualizada) => {
            setCitas((prev) => prev.map((c) => c.id === citaActualizada.id ? citaActualizada : c));
            setToastMessage('Consultorio actualizado correctamente');
            closeModal();
          }}
        />
      )}
      {showModal && selectedEvent && selectedEvent.extendedProps.isBloqueo && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderLeft: `4px solid ${selectedEvent.backgroundColor}` }}>
              <h3>Detalles del Bloqueo</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>Evento:</strong> {selectedEvent.title}</p>
              <p><strong>Inicio:</strong> {new Date(selectedEvent.start).toLocaleString()}</p>
              {selectedEvent.extendedProps.descripcion && <p><strong>Nota:</strong> {selectedEvent.extendedProps.descripcion}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn-danger" onClick={() => handleEliminarBloqueo(selectedEvent.extendedProps.idOriginal)}>
                <i className="fas fa-unlock"></i> Eliminar Bloqueo
              </button>
              <button className="btn-secondary" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    // Modal para cambio rápido de consultorio
    function CambioConsultorioModal({ cita, consultorios, citasDentista, onClose, onUpdated }) {
      const [nuevoConsultorio, setNuevoConsultorio] = useState(cita.id_consultorio ? String(cita.id_consultorio) : '');
      const [saving, setSaving] = useState(false);
      const [error, setError] = useState('');
      const [success, setSuccess] = useState('');

      // Validar disponibilidad y conflictos
      const validarCambio = async (idConsultorio) => {
        setError('');
        if (!idConsultorio) return false;
        // Validar conflicto con otras citas del dentista
        const inicio = new Date(cita.fecha_hora);
        const fin = new Date(inicio.getTime() + Number(cita.duracion_estimada || 30) * 60000);
        const conflicto = (citasDentista || []).find((c) => {
          if (c.id === cita.id) return false;
          if (!c.fecha_hora || !c.duracion_estimada) return false;
          const inicioC = new Date(c.fecha_hora);
          const finC = new Date(inicioC.getTime() + Number(c.duracion_estimada) * 60000);
          return (
            c.id_consultorio && String(c.id_consultorio) === String(idConsultorio) &&
            ((inicio < finC && fin > inicioC))
          );
        });
        if (conflicto) {
          setError('Conflicto: Ya existe una cita en este consultorio en ese horario.');
          return false;
        }
        // Validar disponibilidad (API)
        try {
          const res = await verificarDisponibilidad({
            fecha: cita.fecha_hora.split('T')[0],
            hora: cita.fecha_hora.split('T')[1]?.slice(0,5),
            duracion: cita.duracion_estimada,
            id_consultorio: idConsultorio,
          });
          if (!res.disponible) {
            setError(res.message || 'No disponible en ese horario.');
            return false;
          }
        } catch (err) {
          setError('No se pudo verificar disponibilidad.');
          return false;
        }
        setError('');
        return true;
      };

      const handleGuardar = async () => {
        if (String(nuevoConsultorio) === String(cita.id_consultorio)) {
          setError('Selecciona un consultorio diferente.');
          return;
        }
        setSaving(true);
        const valido = await validarCambio(nuevoConsultorio);
        if (!valido) {
          setSaving(false);
          return;
        }
        // Actualizar cita (simulación, deberías llamar a tu API real de update)
        try {
          // Aquí deberías hacer un fetch/axios PUT a /api/citas/:id para actualizar el consultorio
          // Simulación:
          const citaActualizada = { ...cita, id_consultorio: Number(nuevoConsultorio) };
          // Registrar auditoría de cambio de consultorio
          try {
            await registrarAuditoriaConsultorio({
              accion: "cambio_consultorio",
              modulo: "Consultorios",
              detalle: `Cambio de consultorio para cita ${cita.id}: de ${cita.id_consultorio} a ${nuevoConsultorio}`,
              resultado: "exito",
              id_usuario: cita.id_dentista || null,
              metadatos: {
                id_cita: cita.id,
                id_paciente: cita.id_paciente,
                consultorio_anterior: cita.id_consultorio,
                consultorio_nuevo: nuevoConsultorio,
                fecha: cita.fecha_hora,
              },
            });
          } catch (err) {
            // No bloquear el cambio si falla la auditoría
            console.warn("No se pudo registrar auditoría de consultorio", err);
          }
          setSuccess('Consultorio actualizado correctamente.');
          setTimeout(() => {
            onUpdated(citaActualizada);
          }, 1000);
        } catch (err) {
          setError('No se pudo actualizar la cita.');
        } finally {
          setSaving(false);
        }
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderLeft: '4px solid #2563eb' }}>
              <h3>Cambiar consultorio</h3>
              <button className="modal-close" onClick={onClose}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>Paciente:</strong> {cita.paciente_nombre || cita.paciente?.nombre || 'Paciente'}</p>
              <p><strong>Fecha:</strong> {new Date(cita.fecha_hora).toLocaleString()}</p>
              <div className="dm17-field">
                <label>Nuevo consultorio</label>
                <select value={nuevoConsultorio} onChange={e => setNuevoConsultorio(e.target.value)} disabled={saving}>
                  <option value="">Seleccione</option>
                  {consultorios.map(c => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nombre} {c.equipamiento ? `- ${c.equipamiento.join(', ')}` : ''} {c.estado === 'Mantenimiento' ? '(Mantenimiento)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {error && <div className="dm17-error" style={{ marginTop: 8 }}>{error}</div>}
              {success && <div className="dm17-success" style={{ marginTop: 8 }}>{success}</div>}
            </div>
            <div className="modal-footer">
              <button className="dm17-btn dm17-btn-primary" onClick={handleGuardar} disabled={saving || !nuevoConsultorio}>
                {saving ? 'Guardando...' : 'Guardar cambio'}
              </button>
              <button className="dm17-btn dm17-btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            </div>
          </div>
        </div>
      );
    }
    </div>
  );
};

export default DentistDashboard;