import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import TreatmentHistory from './TreatmentHistory';
import NuevaCitaModal from './NuevaCitaModal';
import MisPacientesScreen from './MisPacientesScreen';
import BloqueoModal from './BloqueoModal';
import bloquesService from '../../services/bloques.service';
import { getAuthToken } from '../../utils/auth';
import { obtenerConsultorios } from '../../services/consultorios.service';
import { actualizarConsultorioCita } from '../../services/citas.service';
import './DentistDashboard.css';

const normalizarEstadoConsultorio = (estado) =>
  String(estado || '').trim().toLowerCase();

const CambioConsultorioModal = ({
  cita,
  consultorios,
  citasDentista,
  onClose,
  onUpdated,
}) => {
  const [nuevoConsultorio, setNuevoConsultorio] = React.useState(
    cita?.id_consultorio ? String(cita.id_consultorio) : ''
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const validarCambio = async (idConsultorio) => {
    setError('');

    if (!idConsultorio) {
      setError('Selecciona un consultorio.');
      return false;
    }

    const consultorioSeleccionado = (consultorios || []).find(
      (c) => String(c.id) === String(idConsultorio)
    );

    const estadoConsultorio = normalizarEstadoConsultorio(
      consultorioSeleccionado?.estado_operativo || consultorioSeleccionado?.estado
    );

    if (
      estadoConsultorio === 'mantenimiento' ||
      estadoConsultorio === 'limpieza'
    ) {
      setError(`El consultorio está en ${estadoConsultorio}.`);
      return false;
    }

    const inicio = new Date(cita.fecha_hora);
    const fin = new Date(
      inicio.getTime() + Number(cita.duracion_estimada || 30) * 60000
    );

    const conflicto = (citasDentista || []).find((c) => {
      if (Number(c.id) === Number(cita.id)) return false;
      if (!c.fecha_hora || !c.duracion_estimada) return false;

      const estadoCita = String(c.estado || '').toLowerCase();
      if (estadoCita === 'cancelada') return false;

      const inicioC = new Date(c.fecha_hora);
      const finC = new Date(
        inicioC.getTime() + Number(c.duracion_estimada || 30) * 60000
      );

      return (
        c.id_consultorio &&
        String(c.id_consultorio) === String(idConsultorio) &&
        inicio < finC &&
        fin > inicioC
      );
    });

    if (conflicto) {
      setError(
        'Conflicto: Ya existe una cita en este consultorio en ese horario.'
      );
      return false;
    }

    return true;
  };

  const handleGuardar = async () => {
    setError('');
    setSuccess('');

    if (!cita?.id) {
      setError('No se encontró la cita.');
      return;
    }

    if (String(nuevoConsultorio) === String(cita.id_consultorio)) {
      setError('Selecciona un consultorio diferente.');
      return;
    }

    const valido = await validarCambio(nuevoConsultorio);
    if (!valido) return;

    try {
      setSaving(true);

      const response = await actualizarConsultorioCita(
        cita.id,
        Number(nuevoConsultorio)
      );

      const dataActualizada = response?.data
        ? {
            ...cita,
            ...response.data,
            id_consultorio: Number(nuevoConsultorio),
          }
        : {
            ...cita,
            id_consultorio: Number(nuevoConsultorio),
          };

      setSuccess(response?.message || 'Consultorio actualizado correctamente.');

      setTimeout(() => {
        onUpdated(dataActualizada);
      }, 800);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la cita.');
    } finally {
      setSaving(false);
    }
  };

  if (!cita) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeft: '4px solid #2563eb' }}>
          <h3>Cambiar consultorio</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p>
            <strong>Paciente:</strong>{' '}
            {cita.paciente_nombre || cita.paciente?.nombre || 'Paciente'}
          </p>

          <p>
            <strong>Fecha:</strong>{' '}
            {new Date(cita.fecha_hora).toLocaleString('es-ES')}
          </p>

          <div className="dm17-field">
            <label>Nuevo consultorio</label>
            <select
              value={nuevoConsultorio}
              onChange={(e) => setNuevoConsultorio(e.target.value)}
              disabled={saving}
            >
              <option value="">Seleccione</option>
              {consultorios.map((c) => {
                const estado = normalizarEstadoConsultorio(
                  c.estado_operativo || c.estado
                );
                const bloqueado =
                  estado === 'mantenimiento' || estado === 'limpieza';

                return (
                  <option
                    key={c.id}
                    value={String(c.id)}
                    disabled={bloqueado}
                  >
                    {c.nombre}
                    {c.equipamiento?.length
                      ? ` - ${c.equipamiento.join(', ')}`
                      : ''}
                    {bloqueado ? ` (${estado})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {error ? (
            <div className="dm17-error" style={{ marginTop: 8 }}>
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="dm17-success" style={{ marginTop: 8 }}>
              {success}
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          <button
            className="dm17-btn dm17-btn-primary"
            onClick={handleGuardar}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>

          <button
            className="dm17-btn dm17-btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const DentistDashboard = ({ userData, onLogout }) => {
  const [citas, setCitas] = useState([]);
  const [bloques, setBloques] = useState([]);
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
  const [showNuevaCitaModal, setShowNuevaCitaModal] = useState(false);
  const [showBloqueoModal, setShowBloqueoModal] = useState(false);
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

  const normalizarEstado = (estado) =>
    String(estado || '').trim().toLowerCase();

  const ordenarCitasPorFecha = (lista) => {
    if (!Array.isArray(lista)) return [];
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
    return sumarMinutos(
      cita.fecha_hora,
      cita.duracion_estimada || 30
    ).toISOString();
  };

  const calcularMetricas = (listaCitas) => {
    if (!Array.isArray(listaCitas)) {
      return {
        citasHoy: 0,
        pacientesVistos: 0,
        siguienteCita: null,
        tratamientosPendientes: 0,
      };
    }

    const hoy = new Date().toDateString();

    const citasHoy = ordenarCitasPorFecha(
      listaCitas.filter(
        (cita) =>
          new Date(cita.fecha_hora).toDateString() === hoy &&
          !['cancelada'].includes(normalizarEstado(cita.estado))
      )
    );

    const citasCompletadasHoy = citasHoy.filter(
      (cita) => normalizarEstado(cita.estado) === 'completada'
    );

    const siguienteCitaData = citasHoy.find(
      (cita) =>
        !['completada', 'cancelada'].includes(normalizarEstado(cita.estado))
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
    setTimeout(() => setToastMessage(''), 3000);
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

    return token
      ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      : { 'Content-Type': 'application/json' };
  };

  const fetchBloques = async (dentistaIdParam) => {
    const dentistaId = dentistaIdParam || dentistaInfo?.id;
    if (!dentistaId) return;

    try {
      const response = await bloquesService.obtenerBloques(dentistaId);
      const dataLimpia = Array.isArray(response) ? response : response?.data || [];
      setBloques(dataLimpia);
    } catch (error) {
      console.error('Error al obtener bloques:', error);
      setBloques([]);
    }
  };

  const handleSaveBloqueo = async (datos) => {
    try {
      await bloquesService.crearBloqueo(datos);
      mostrarToast('Horario bloqueado con éxito');
      setShowBloqueoModal(false);
      fetchBloques();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Error al crear el bloqueo';
      alert(msg);
    }
  };

  const handleEliminarBloqueo = async (id) => {
    if (!window.confirm('¿Desea eliminar este bloqueo de horario?')) return;

    try {
      await bloquesService.eliminarBloque(id);
      mostrarToast('Bloqueo eliminado');
      closeModal();
      fetchBloques();
    } catch (error) {
      alert('Error al eliminar el bloqueo');
    }
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

  const handleCitaCancelada = (citaCancelada) => {
    const idCita = Number(citaCancelada?.id);

    setCitas((prev) => {
      const actualizadas = prev.filter((cita) => Number(cita.id) !== idCita);
      setMetrics(calcularMetricas(actualizadas));
      return actualizadas;
    });

    setSelectedEvent((prev) => {
      if (!prev) return prev;
      return String(prev.id) === String(idCita) ? null : prev;
    });

    setShowModal((prev) => {
      if (selectedEvent && String(selectedEvent.id) === String(idCita)) {
        return false;
      }
      return prev;
    });

    setSelectedCita((prev) => {
      if (!prev) return prev;
      return Number(prev.id) === idCita ? null : prev;
    });

    mostrarToast('Cita cancelada correctamente');
  };

  const handleSelectCita = (cita) => {
    setSelectedCita(cita);
    setAgendaDate(new Date(cita.fecha_hora));

    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(new Date(cita.fecha_hora));
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
        calendarRef.current.getApi().gotoDate(new Date(citaHoy.fecha_hora));
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
          pacienteDetalle.nombre_completo || pacienteDetalle.nombre || 'Paciente',
        paciente: pacienteDetalle,
        esBusquedaPaciente: true,
      };

      setSelectedCita(citaVirtual);
      setAgendaDate(new Date());

      if (calendarRef.current) {
        calendarRef.current.getApi().gotoDate(new Date());
      }
    }

    setActiveView('agenda');
    mostrarToast('Paciente seleccionado correctamente');
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

  const handleDateClick = (info) => {
    setAgendaDate(new Date(info.date));
  };

  const handleViewChange = (view) => {
    setCurrentView(view);

    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
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
        const response = await fetch('http://localhost:3000/api/dentistas/perfil', {
          headers: getAuthHeaders(),
        });

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
      } catch (error) {
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
          const citasData = Array.isArray(data) ? data : data?.data || [];
          const citasOrdenadas = ordenarCitasPorFecha(citasData);

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
        }
      } catch (error) {
        console.error('Error obteniendo citas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCitas();
  }, []);

  useEffect(() => {
    if (dentistaInfo?.id) {
      fetchBloques(dentistaInfo.id);
    }
  }, [dentistaInfo]);

  const eventsToDisplay = useMemo(() => {
    const eventosCitas = (Array.isArray(citas) ? citas : []).map((cita) => {
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
          isBloqueo: false,
        },
        backgroundColor: estadoColores[estado]?.background || '#007bff',
        borderColor: estadoColores[estado]?.border || '#0069d9',
        textColor: '#ffffff',
      };
    });

    const eventosBloques = (Array.isArray(bloques) ? bloques : []).map((bloque) => ({
      id: `bloque-${bloque.id}`,
      title: `BLOQUEO: ${(bloque.tipo || 'horario').toUpperCase()}`,
      start: bloque.fecha_inicio,
      end: bloque.fecha_fin,
      className: 'event-bloqueo',
      extendedProps: {
        isBloqueo: true,
        idOriginal: bloque.id,
        descripcion: bloque.descripcion,
        tipo: bloque.tipo,
      },
      backgroundColor: '#9b59b6',
      borderColor: '#8e44ad',
      textColor: '#ffffff',
    }));

    return [...eventosCitas, ...eventosBloques];
  }, [citas, bloques]);

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
                      className={`view-btn ${
                        currentView === 'timeGridDay' ? 'active' : ''
                      }`}
                      onClick={() => handleViewChange('timeGridDay')}
                    >
                      DÍA
                    </button>

                    <button
                      className={`view-btn ${
                        currentView === 'timeGridWeek' ? 'active' : ''
                      }`}
                      onClick={() => handleViewChange('timeGridWeek')}
                    >
                      SEMANA
                    </button>

                    <button
                      className={`view-btn ${
                        currentView === 'dayGridMonth' ? 'active' : ''
                      }`}
                      onClick={() => handleViewChange('dayGridMonth')}
                    >
                      MES
                    </button>
                  </div>

                  <div className="hour-selector">
                    <label>
                      <i className="fas fa-clock"></i> Mostrar desde:
                      <select
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                      >
                        {horasDisponibles.map((hora) => (
                          <option key={hora} value={hora}>
                            {hora}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="calendar-wrapper">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[
                      dayGridPlugin,
                      timeGridPlugin,
                      interactionPlugin,
                      listPlugin,
                    ]}
                    headerToolbar={false}
                    initialView={currentView}
                    events={eventsToDisplay}
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
                    titleFormat={{ year: 'numeric', month: 'long' }}
                    dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
                  />
                </div>
              </div>

              <div className="dashboard-right-column">
                <AppointmentsList
                  citas={citasAgendaSeleccionada}
                  onSelectCita={handleSelectCita}
                  selectedCitaId={selectedCita?.id}
                  selectedDate={agendaDate}
                  onCitaCancelada={handleCitaCancelada}
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
          <div className="dashboard-treatments-main">
            <TreatmentHistory />
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
        return (
          <div className="placeholder-content">
            <h2>{String(activeView || '').toUpperCase()}</h2>
            <p>Contenido en desarrollo...</p>
          </div>
        );
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
            </div>
          </div>

          <div className="dentist-topbar-right">
            <button
              className="btn-bloquear-horario"
              onClick={() => setShowBloqueoModal(true)}
            >
              <i className="fas fa-lock"></i> Bloquear horario
            </button>

            <button
              className="new-appointment-btn"
              onClick={() => setShowNuevaCitaModal(true)}
            >
              + Nueva cita
            </button>
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
        citasDentista={citas}
      />

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
            setCitas((prev) => {
              const actualizadas = prev.map((c) =>
                Number(c.id) === Number(citaActualizada.id) ? citaActualizada : c
              );
              setMetrics(calcularMetricas(actualizadas));
              return actualizadas;
            });

            setSelectedCita((prev) => {
              if (!prev) return prev;
              return Number(prev.id) === Number(citaActualizada.id)
                ? citaActualizada
                : prev;
            });

            setToastMessage('Consultorio actualizado correctamente');
            closeModal();
          }}
        />
      )}

      {showModal && selectedEvent && selectedEvent.extendedProps.isBloqueo && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{ borderLeft: `4px solid ${selectedEvent.backgroundColor}` }}
            >
              <h3>Detalles del Bloqueo</h3>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p>
                <strong>Evento:</strong> {selectedEvent.title}
              </p>
              <p>
                <strong>Inicio:</strong>{' '}
                {new Date(selectedEvent.start).toLocaleString()}
              </p>
              <p>
                <strong>Fin:</strong>{' '}
                {new Date(selectedEvent.end).toLocaleString()}
              </p>

              {selectedEvent.extendedProps.descripcion && (
                <p>
                  <strong>Nota:</strong> {selectedEvent.extendedProps.descripcion}
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-danger"
                onClick={() =>
                  handleEliminarBloqueo(selectedEvent.extendedProps.idOriginal)
                }
              >
                <i className="fas fa-unlock"></i> Eliminar Bloqueo
              </button>

              <button className="btn-secondary" onClick={closeModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentistDashboard;