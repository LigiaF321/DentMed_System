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
import BloqueoModal from './BloqueoModal'; 
// CORRECCIÓN: Nombre de archivo correcto según tu captura
import bloquesService from '../../services/bloques.service'; 
import { getAuthToken } from '../../utils/auth';
import { obtenerConsultorios } from '../../services/consultorios.service';
import './DentistDashboard.css';

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

  const estadoColores = {
    confirmada: { background: '#28a745', border: '#1e7e34', text: 'Confirmada', icon: 'fa-check-circle' },
    completada: { background: '#6c757d', border: '#545b62', text: 'Completada', icon: 'fa-check-double' },
    cancelada: { background: '#dc3545', border: '#a71d2a', text: 'Cancelada', icon: 'fa-times-circle' },
    reprogramada: { background: '#ffc107', border: '#e0a800', text: 'Reprogramada', icon: 'fa-calendar-alt' },
    pendiente: { background: '#17a2b8', border: '#117a8b', text: 'Pendiente', icon: 'fa-clock' },
    bloqueado: { background: '#9b59b6', border: '#8e44ad', text: 'Bloqueado', icon: 'fa-lock' },
    programada: { background: '#2563eb', border: '#1d4ed8', text: 'Programada', icon: 'fa-calendar-check' },
  };

  const fetchBloques = async () => {
    if (!dentistaInfo?.id) return;
    try {
      const response = await bloquesService.obtenerBloques(dentistaInfo.id);
      // CORRECCIÓN: Validación robusta para evitar "map is not a function"
      const dataLimpia = Array.isArray(response) ? response : (response?.data || []);
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
      // CORRECCIÓN: Mostrar el error real del servidor si existe
      const msg = error.response?.data?.message || error.message || 'Error al crear el bloqueo';
      alert(msg);
    }
  };

  const handleEliminarBloqueo = async (id) => {
    if (window.confirm('¿Desea eliminar este bloqueo de horario?')) {
      try {
        await bloquesService.eliminarBloque(id);
        mostrarToast('Bloqueo eliminado');
        closeModal();
        fetchBloques();
      } catch (error) {
        alert('Error al eliminar el bloqueo');
      }
    }
  };

  const normalizarEstado = (estado) => String(estado || '').trim().toLowerCase();

  const ordenarCitasPorFecha = (lista) => {
    if (!Array.isArray(lista)) return [];
    return [...lista].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  };

  const esMismoDia = (fechaA, fechaB) => {
    const a = new Date(fechaA);
    const b = new Date(fechaB);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
    if (!Array.isArray(listaCitas)) return { citasHoy: 0, pacientesVistos: 0, siguienteCita: null, tratamientosPendientes: 0 };
    const hoy = new Date().toDateString();
    const citasHoy = ordenarCitasPorFecha(listaCitas.filter((cita) => new Date(cita.fecha_hora).toDateString() === hoy));
    const citasCompletadasHoy = citasHoy.filter((cita) => normalizarEstado(cita.estado) === 'completada');
    const siguienteCitaData = citasHoy.find((cita) => !['completada', 'cancelada'].includes(normalizarEstado(cita.estado)));

    return {
      citasHoy: citasHoy.length,
      pacientesVistos: citasCompletadasHoy.length,
      siguienteCita: siguienteCitaData ? new Date(siguienteCitaData.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null,
      tratamientosPendientes: listaCitas.filter((cita) => ['pendiente', 'confirmada', 'programada'].includes(normalizarEstado(cita.estado))).length,
    };
  };

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

      <NuevaCitaModal open={showNuevaCitaModal} onClose={() => setShowNuevaCitaModal(false)} onCreated={handleNuevaCitaCreada} consultorios={consultorios} />
      
      <BloqueoModal 
        isOpen={showBloqueoModal} 
        onClose={() => setShowBloqueoModal(false)} 
        onSave={handleSaveBloqueo} 
        idDentista={dentistaInfo?.id} 
      />

      {showModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderLeft: `4px solid ${selectedEvent.backgroundColor}` }}>
              <h3>{selectedEvent.extendedProps.isBloqueo ? 'Detalles del Bloqueo' : 'Detalles de la Cita'}</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p><strong>Evento:</strong> {selectedEvent.title}</p>
              <p><strong>Inicio:</strong> {new Date(selectedEvent.start).toLocaleString()}</p>
              {selectedEvent.extendedProps.descripcion && <p><strong>Nota:</strong> {selectedEvent.extendedProps.descripcion}</p>}
            </div>
            <div className="modal-footer">
              {selectedEvent.extendedProps.isBloqueo && (
                <button className="btn-danger" onClick={() => handleEliminarBloqueo(selectedEvent.extendedProps.idOriginal)}>
                  <i className="fas fa-unlock"></i> Eliminar Bloqueo
                </button>
              )}
              <button className="btn-secondary" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentistDashboard;