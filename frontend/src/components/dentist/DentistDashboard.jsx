import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import DentistSidebar from './DentistSidebar';
import MetricCards from './MetricCards';
import AppointmentsList from './AppointmentsList';
import Odontograma from './Odontograma';
import PatientTabs from './PatientTabs';
import NuevaCitaModal from './NuevaCitaModal';
import MisPacientesScreen from './MisPacientesScreen';
import { getAuthToken } from '../../utils/auth';
import { obtenerConsultorios } from '../../services/consultorios.service';
import './DentistDashboard.css';

const DentistDashboard = ({ userData, onLogout }) => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dentistaInfo, setDentistaInfo] = useState(null);
  const [consultorios, setConsultorios] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [startHour, setStartHour] = useState('07:00');
  const [selectedCita, setSelectedCita] = useState(null);
  const [agendaDate, setAgendaDate] = useState(new Date());
  const [activeView, setActiveView] = useState('agenda');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNuevaCitaModal, setShowNuevaCitaModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [metrics, setMetrics] = useState({
    citasHoy: 0,
    pacientesVistos: 0,
    siguienteCita: null,
    tratamientosPendientes: 0,
  });

  const calendarRef = useRef(null);

  const horasDisponibles = ['06:00', '07:00', '08:00', '09:00', '10:00'];

  const estadoColores = {
    confirmada: {
      background: '#28a745',
      border: '#1e7e34',
      text: 'Confirmada',
      icon: 'fa-check-circle',
    },
    completada: {
      background: '#6c757d',
      border: '#545b62',
      text: 'Completada',
      icon: 'fa-check-double',
    },
    cancelada: {
      background: '#dc3545',
      border: '#a71d2a',
      text: 'Cancelada',
      icon: 'fa-times-circle',
    },
    reprogramada: {
      background: '#ffc107',
      border: '#e0a800',
      text: 'Reprogramada',
      icon: 'fa-calendar-alt',
    },
    pendiente: {
      background: '#17a2b8',
      border: '#117a8b',
      text: 'Pendiente',
      icon: 'fa-clock',
    },
    bloqueado: {
      background: '#9b59b6',
      border: '#8e44ad',
      text: 'Bloqueado',
      icon: 'fa-lock',
    },
    programada: {
      background: '#2563eb',
      border: '#1d4ed8',
      text: 'Programada',
      icon: 'fa-calendar-check',
    },
  };

  const normalizarEstado = (estado) => String(estado || '').trim().toLowerCase();

  const ordenarCitasPorFecha = (lista) => {
    return [...lista].sort(
      (a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora)
    );
  };

  const esMismoDia = (fechaA, fechaB) => {
    const a = new Date(fechaA);
    const b = new Date(fechaB);

    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const sumarMinutos = (fecha, minutos) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setMinutes(nuevaFecha.getMinutes() + Number(minutos || 0));
    return nuevaFecha;
  };

  const obtenerFechaFin = (cita) => {
    if (cita.fecha_fin) return cita.fecha_fin;
    return sumarMinutos(cita.fecha_hora, cita.duracion_estimada || 30).toISOString();
  };

  const calcularMetricas = (listaCitas) => {
    const hoy = new Date().toDateString();

    const citasHoy = ordenarCitasPorFecha(
      listaCitas.filter(
        (cita) => new Date(cita.fecha_hora).toDateString() === hoy
      )
    );

    const citasCompletadasHoy = citasHoy.filter(
      (cita) => normalizarEstado(cita.estado) === 'completada'
    );

    const siguienteCitaData = citasHoy.find(
      (cita) => !['completada', 'cancelada'].includes(normalizarEstado(cita.estado))
    );

    return {
      citasHoy: citasHoy.length,
      pacientesVistos: citasCompletadasHoy.length,
      siguienteCita: siguienteCitaData
        ? new Date(siguienteCitaData.fecha_hora).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : null,
      tratamientosPendientes: listaCitas.filter((cita) =>
        ['pendiente', 'confirmada', 'programada'].includes(
          normalizarEstado(cita.estado)
        )
      ).length,
    };
  };

  const mostrarToast = (mensaje) => {
    setToastMessage(mensaje);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const obtenerPacienteNombre = (cita) => {
    return (
      cita.paciente_nombre ||
      cita.paciente?.nombre_completo ||
      cita.paciente?.nombre ||
      'Paciente'
    );
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
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
    setSelectedCita(response.selectedCita || nuevaCita);

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(fechaNuevaCita);
      calendarApi.changeView('timeGridDay');
      setCurrentView('timeGridDay');
    }

    mostrarToast('Cita creada correctamente');
  };

  const handleSelectCita = (cita) => {
    setSelectedCita(cita);
    setAgendaDate(new Date(cita.fecha_hora));

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const event = calendarApi.getEventById(String(cita.id));

      if (event) {
        calendarApi.gotoDate(event.start);
      }
    }
  };

  const handleSelectPatientFromSearch = (pacienteDetalle) => {
    const citaHoy = citas.find((cita) => {
      const samePatient = Number(cita.id_paciente) === Number(pacienteDetalle.id);
      const sameDay = esMismoDia(cita.fecha_hora, new Date());
      const estado = normalizarEstado(cita.estado);

      return samePatient && sameDay && !['cancelada', 'completada'].includes(estado);
    });

    if (citaHoy) {
      setSelectedCita(citaHoy);
      setAgendaDate(new Date(citaHoy.fecha_hora));

      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.gotoDate(new Date(citaHoy.fecha_hora));
      }
    } else {
      const citaVirtual = {
        id: `paciente-${pacienteDetalle.id}`,
        id_paciente: pacienteDetalle.id,
        fecha_hora: new Date().toISOString(),
        fecha_fin: sumarMinutos(new Date(), 30).toISOString(),
        motivo: 'Paciente seleccionado desde Mis Pacientes',
        estado: 'pendiente',
        duracion_estimada: 30,
        paciente_nombre:
          pacienteDetalle.nombre_completo ||
          pacienteDetalle.nombre ||
          'Paciente',
        paciente: pacienteDetalle,
        esBusquedaPaciente: true,
      };

      setSelectedCita(citaVirtual);
      setAgendaDate(new Date());

      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.gotoDate(new Date());
      }
    }

    setActiveView('agenda');
    mostrarToast('Paciente seleccionado correctamente');
  };

  const handleEventClick = (info) => {
    const cita = citas.find((c) => c.id === parseInt(info.event.id, 10));

    if (cita) {
      setAgendaDate(new Date(cita.fecha_hora));
      handleSelectCita(cita);
    }

    setSelectedEvent(info.event);
    setShowModal(true);
  };

  const handleDateClick = (info) => {
    setAgendaDate(new Date(info.date));
  };

  const handleViewChange = (view) => {
    setCurrentView(view);

    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
    }
  };

  const handleToday = () => {
    setAgendaDate(new Date());

    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDentistaInfo = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/dentistas/perfil', {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          setDentistaInfo(data);
          return;
        }
      } catch (error) {
        console.error('Error obteniendo perfil del dentista:', error);
      }

      setDentistaInfo({
        nombre: 'Juan Pérez',
        especialidad: 'Odontología General',
      });
    };

    fetchDentistaInfo();
  }, []);

  useEffect(() => {
    const fetchConsultorios = async () => {
      try {
        const response = await obtenerConsultorios();
        setConsultorios(response.data || []);
      } catch (error) {
        console.error('Error obteniendo consultorios:', error);
        setConsultorios([]);
      }
    };

    fetchConsultorios();
  }, []);

  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/citas/dentista', {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();

          const citasOrdenadas = ordenarCitasPorFecha(data);
          setCitas(citasOrdenadas);
          setMetrics(calcularMetricas(citasOrdenadas));

          const hoy = new Date().toDateString();
          const primeraCita = citasOrdenadas.find(
            (cita) =>
              new Date(cita.fecha_hora).toDateString() === hoy &&
              !['completada', 'cancelada'].includes(normalizarEstado(cita.estado))
          );

          if (primeraCita) {
            setSelectedCita(primeraCita);
            setAgendaDate(new Date(primeraCita.fecha_hora));
          }

          return;
        }
      } catch (error) {
        console.error('Error obteniendo citas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCitas();
  }, []);

  if (loading) {
    return (
      <div className="dentista-loading">
        <div className="loading-spinner"></div>
        <p>Cargando tu calendario...</p>
      </div>
    );
  }

  const citasAgendaSeleccionada = ordenarCitasPorFecha(
    citas.filter((cita) => esMismoDia(cita.fecha_hora, agendaDate))
  );

  const renderContent = () => {
    switch (activeView) {
      case 'agenda':
        return (
          <>
            <MetricCards
              citasHoy={metrics.citasHoy}
              pacientesVistos={metrics.pacientesVistos}
              siguienteCita={metrics.siguienteCita}
              tratamientosPendientes={metrics.tratamientosPendientes}
            />

            <div className="dashboard-two-columns">
              <div className="dashboard-left-column">
                <div className="calendar-controls">
                  <div className="nav-buttons">
                    <button className="nav-btn" onClick={handlePrev}>
                      <i className="fas fa-chevron-left"></i> ANTERIOR
                    </button>
                    <button className="nav-btn today-btn" onClick={handleToday}>
                      <i className="fas fa-calendar-day"></i> HOY
                    </button>
                    <button className="nav-btn" onClick={handleNext}>
                      SIGUIENTE <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>

                  <div className="view-buttons">
                    <button
                      className={`view-btn ${currentView === 'timeGridDay' ? 'active' : ''}`}
                      onClick={() => handleViewChange('timeGridDay')}
                    >
                      <i className="fas fa-calendar-day"></i> DÍA
                    </button>
                    <button
                      className={`view-btn ${currentView === 'timeGridWeek' ? 'active' : ''}`}
                      onClick={() => handleViewChange('timeGridWeek')}
                    >
                      <i className="fas fa-calendar-week"></i> SEMANA
                    </button>
                    <button
                      className={`view-btn ${currentView === 'dayGridMonth' ? 'active' : ''}`}
                      onClick={() => handleViewChange('dayGridMonth')}
                    >
                      <i className="fas fa-calendar-alt"></i> MES
                    </button>
                  </div>

                  <div className="hour-selector">
                    <label>
                      <i className="fas fa-clock"></i> Mostrar desde:
                      <select value={startHour} onChange={(e) => setStartHour(e.target.value)}>
                        {horasDisponibles.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="calendar-wrapper">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    initialView={currentView}
                    events={citas.map((cita) => {
                      const estado = normalizarEstado(cita.estado);

                      return {
                        id: String(cita.id),
                        title: obtenerPacienteNombre(cita),
                        start: cita.fecha_hora,
                        end: obtenerFechaFin(cita),
                        extendedProps: {
                          estado,
                          motivo: cita.motivo,
                          paciente: cita.paciente,
                        },
                        backgroundColor: estadoColores[estado]?.background || '#007bff',
                        borderColor: estadoColores[estado]?.border || '#0069d9',
                        textColor: '#ffffff',
                      };
                    })}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    slotMinTime={startHour}
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
                    slotDuration="00:30:00"
                    height="auto"
                    contentHeight={450}
                    locale="es"
                    firstDay={1}
                    buttonText={{
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      day: 'Día',
                    }}
                    titleFormat={{
                      year: 'numeric',
                      month: 'long',
                    }}
                    dayHeaderFormat={{
                      weekday: 'short',
                      day: 'numeric',
                    }}
                  />
                </div>
              </div>

              <div className="dashboard-right-column">
                <AppointmentsList
                  citas={citasAgendaSeleccionada}
                  onSelectCita={handleSelectCita}
                  selectedCitaId={selectedCita?.id}
                  selectedDate={agendaDate}
                />
                <Odontograma paciente={selectedCita} />
                <PatientTabs paciente={selectedCita} />
              </div>
            </div>
          </>
        );

      case 'pacientes':
        return (
          <MisPacientesScreen
            dentistaInfo={dentistaInfo}
            onSelectPatient={handleSelectPatientFromSearch}
          />
        );

      case 'tratamientos':
        return (
          <div className="placeholder-content">
            <h2>Tratamientos</h2>
            <p>Próximamente...</p>
          </div>
        );

      case 'notas':
        return (
          <div className="placeholder-content">
            <h2>Notas</h2>
            <p>Próximamente...</p>
          </div>
        );

      case 'perfil':
        return (
          <div className="placeholder-content">
            <h2>Mi Perfil</h2>
            <p>Próximamente...</p>
          </div>
        );

      case 'configuracion':
        return (
          <div className="placeholder-content">
            <h2>Configuración</h2>
            <p>Próximamente...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dentist-dashboard-layout">
      <DentistSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        onLogout={onLogout}
      />

      <main className="dentist-main-content">
        <div className="dentist-topbar">
          <div className="dentist-topbar-left">
            <div className="doctor-name-topbar">
              <i className="fas fa-user-md"></i>
              <span>Dr. {dentistaInfo?.nombre || 'Cargando...'}</span>
              <span className="doctor-specialty-topbar">
                {' '}
                - {dentistaInfo?.especialidad || 'Odontología'}
              </span>
            </div>
          </div>

          <div className="dentist-topbar-right">
            <button
              className="new-appointment-btn"
              onClick={() => setShowNuevaCitaModal(true)}
            >
              + Nueva cita
            </button>

            <button
              className="topbar-icon-btn"
              title="Configuración"
              onClick={() => setActiveView('configuracion')}
            >
              <i className="fas fa-cog"></i>
            </button>

            <button className="topbar-icon-btn" title="Notificaciones">
              <i className="fas fa-bell"></i>
              <span className="notification-badge">3</span>
            </button>

            <div className="profile-dropdown">
              <button
                className="profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="profile-avatar">
                  <i className="fas fa-user-circle"></i>
                </div>
                <i className="fas fa-chevron-down"></i>
              </button>

              {showProfileMenu && (
                <div className="dropdown-menu">
                  <button onClick={() => setActiveView('perfil')}>
                    <i className="fas fa-user"></i> Mi Perfil
                  </button>
                  <button onClick={() => setActiveView('configuracion')}>
                    <i className="fas fa-cog"></i> Configuración
                  </button>
                  <hr />
                  <button onClick={onLogout} className="logout-option">
                    <i className="fas fa-sign-out-alt"></i> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {renderContent()}
      </main>

      {toastMessage ? (
        <div className="dentist-toast-success">{toastMessage}</div>
      ) : null}

      <NuevaCitaModal
        open={showNuevaCitaModal}
        onClose={() => setShowNuevaCitaModal(false)}
        onCreated={handleNuevaCitaCreada}
        consultorios={consultorios}
      />

      {showModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{
                borderLeftColor: selectedEvent.backgroundColor,
                borderLeftWidth: '4px',
                borderLeftStyle: 'solid',
              }}
            >
              <h3>
                <i className="fas fa-tooth"></i> Detalles de la cita
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">
                  <i className="fas fa-user"></i> Paciente:
                </span>
                <span className="detail-value">{selectedEvent.title}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <i className="fas fa-calendar-day"></i> Fecha:
                </span>
                <span className="detail-value">
                  {new Date(selectedEvent.start).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <i className="fas fa-clock"></i> Hora:
                </span>
                <span className="detail-value">
                  {new Date(selectedEvent.start).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(selectedEvent.end).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <i className="fas fa-stethoscope"></i> Motivo:
                </span>
                <span className="detail-value">
                  {selectedEvent.extendedProps.motivo || 'Consulta general'}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <i className="fas fa-tag"></i> Estado:
                </span>
                <span
                  className="detail-badge"
                  style={{ backgroundColor: selectedEvent.backgroundColor }}
                >
                  {estadoColores[selectedEvent.extendedProps.estado]?.text ||
                    selectedEvent.extendedProps.estado}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cerrar
              </button>
              <button className="btn-primary">
                <i className="fas fa-edit"></i> Reprogramar
              </button>
              <button className="btn-danger">
                <i className="fas fa-trash"></i> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentistDashboard;