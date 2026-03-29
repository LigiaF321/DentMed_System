// frontend/src/components/dentist/DentistDashboard.jsx
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
import './DentistDashboard.css';

const DentistDashboard = ({ userData, onLogout }) => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dentistaInfo, setDentistaInfo] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [startHour, setStartHour] = useState('07:00');
  const [selectedCita, setSelectedCita] = useState(null);
  const [activeView, setActiveView] = useState('agenda');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [metrics, setMetrics] = useState({
    citasHoy: 0,
    pacientesVistos: 0,
    siguienteCita: null,
    tratamientosPendientes: 0
  });
  const calendarRef = useRef(null);

  const horasDisponibles = ['06:00', '07:00', '08:00', '09:00', '10:00'];

  const estadoColores = {
    confirmada: { background: '#28a745', border: '#1e7e34', text: 'Confirmada', icon: 'fa-check-circle' },
    completada: { background: '#6c757d', border: '#545b62', text: 'Completada', icon: 'fa-check-double' },
    cancelada: { background: '#dc3545', border: '#a71d2a', text: 'Cancelada', icon: 'fa-times-circle' },
    reprogramada: { background: '#ffc107', border: '#e0a800', text: 'Reprogramada', icon: 'fa-calendar-alt' },
    pendiente: { background: '#17a2b8', border: '#117a8b', text: 'Pendiente', icon: 'fa-clock' },
    bloqueado: { background: '#9b59b6', border: '#8e44ad', text: 'Bloqueado', icon: 'fa-lock' }
  };

  // Cerrar menú de perfil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Obtener información del dentista
  useEffect(() => {
    const fetchDentistaInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/dentista/perfil', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setDentistaInfo(data);
        }
      } catch (error) {
        console.error('Error:', error);
        setDentistaInfo({ nombre: 'Juan Pérez', especialidad: 'Odontología General' });
      }
    };
    fetchDentistaInfo();
  }, []);

  // Obtener citas del dentista
  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/citas/dentista', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCitas(data);
          
          const hoy = new Date().toDateString();
          const citasHoy = data.filter(cita => new Date(cita.fecha_hora).toDateString() === hoy);
          const citasCompletadasHoy = citasHoy.filter(c => c.estado === 'completada');
          const siguienteCitaData = citasHoy.find(c => c.estado !== 'completada');
          
          setMetrics({
            citasHoy: citasHoy.length,
            pacientesVistos: citasCompletadasHoy.length,
            siguienteCita: siguienteCitaData ? new Date(siguienteCitaData.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null,
            tratamientosPendientes: data.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length
          });
          
          const primeraCita = citasHoy.find(c => c.estado !== 'completada');
          if (primeraCita) {
            setSelectedCita(primeraCita);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        const mockCitas = [
          { id: 1, paciente_nombre: 'Mateo Rivera', fecha_hora: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(), motivo: 'Limpieza', estado: 'confirmada', paciente: { id: 1, nombre: 'Mateo Rivera', telefono: '12345678' } },
          { id: 2, paciente_nombre: 'Laura Flores', fecha_hora: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(), motivo: 'Endodoncia', estado: 'pendiente', paciente: { id: 2, nombre: 'Laura Flores', telefono: '87654321' } },
          { id: 3, paciente_nombre: 'Sofía García', fecha_hora: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(), motivo: 'Revisión', estado: 'confirmada', paciente: { id: 3, nombre: 'Sofía García', telefono: '11223344' } }
        ];
        setCitas(mockCitas);
        
        const hoy = new Date().toDateString();
        const citasHoy = mockCitas.filter(c => new Date(c.fecha_hora).toDateString() === hoy);
        setMetrics({
          citasHoy: citasHoy.length,
          pacientesVistos: 0,
          siguienteCita: '11:00 AM',
          tratamientosPendientes: 3
        });
        setSelectedCita(mockCitas[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchCitas();
  }, []);

  const handleSelectCita = (cita) => {
    setSelectedCita(cita);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const event = calendarApi.getEventById(cita.id.toString());
      if (event) {
        // Resaltar o mostrar el evento
      }
    }
  };

  const handleEventClick = (info) => {
    const cita = citas.find(c => c.id === parseInt(info.event.id));
    if (cita) {
      handleSelectCita(cita);
    }
    setSelectedEvent(info.event);
    setShowModal(true);
  };

  const handleDateClick = (info) => { console.log('Fecha:', info.dateStr); };
  const handleViewChange = (view) => { setCurrentView(view); if (calendarRef.current) calendarRef.current.getApi().changeView(view); };
  const handlePrev = () => { if (calendarRef.current) calendarRef.current.getApi().prev(); };
  const handleNext = () => { if (calendarRef.current) calendarRef.current.getApi().next(); };
  const handleToday = () => { if (calendarRef.current) calendarRef.current.getApi().today(); };
  const closeModal = () => { setShowModal(false); setSelectedEvent(null); };

  if (loading) {
    return <div className="dentista-loading"><div className="loading-spinner"></div><p>Cargando tu calendario...</p></div>;
  }

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
                    <button className="nav-btn" onClick={handlePrev}><i className="fas fa-chevron-left"></i> ANTERIOR</button>
                    <button className="nav-btn today-btn" onClick={handleToday}><i className="fas fa-calendar-day"></i> HOY</button>
                    <button className="nav-btn" onClick={handleNext}>SIGUIENTE <i className="fas fa-chevron-right"></i></button>
                  </div>
                  <div className="view-buttons">
                    <button className={`view-btn ${currentView === 'timeGridDay' ? 'active' : ''}`} onClick={() => handleViewChange('timeGridDay')}><i className="fas fa-calendar-day"></i> DÍA</button>
                    <button className={`view-btn ${currentView === 'timeGridWeek' ? 'active' : ''}`} onClick={() => handleViewChange('timeGridWeek')}><i className="fas fa-calendar-week"></i> SEMANA</button>
                    <button className={`view-btn ${currentView === 'dayGridMonth' ? 'active' : ''}`} onClick={() => handleViewChange('dayGridMonth')}><i className="fas fa-calendar-alt"></i> MES</button>
                  </div>
                  <div className="hour-selector">
                    <label><i className="fas fa-clock"></i> Mostrar desde:
                      <select value={startHour} onChange={(e) => setStartHour(e.target.value)}>
                        {horasDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
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
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    initialView={currentView}
                    events={citas.map(cita => ({
                      id: cita.id,
                      title: cita.paciente_nombre,
                      start: cita.fecha_hora,
                      end: cita.fecha_fin,
                      extendedProps: { estado: cita.estado, motivo: cita.motivo },
                      backgroundColor: estadoColores[cita.estado]?.background || '#007bff',
                      borderColor: estadoColores[cita.estado]?.border || '#0069d9',
                      textColor: '#ffffff'
                    }))}
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
                      day: 'Día'
                    }}
                    titleFormat={{
                      year: 'numeric',
                      month: 'long'
                    }}
                    dayHeaderFormat={{
                      weekday: 'short',
                      day: 'numeric'
                    }}
                  />
                </div>
              </div>
              
              <div className="dashboard-right-column">
                <AppointmentsList 
                  citas={citas.filter(c => new Date(c.fecha_hora).toDateString() === new Date().toDateString())}
                  onSelectCita={handleSelectCita}
                  selectedCitaId={selectedCita?.id}
                />
                <Odontograma paciente={selectedCita} />
                <PatientTabs paciente={selectedCita} />
              </div>
            </div>
          </>
        );
      case 'pacientes':
        return <div className="placeholder-content"><h2>Mis Pacientes</h2><p>Próximamente...</p></div>;
      case 'tratamientos':
        return <div className="placeholder-content"><h2>Tratamientos</h2><p>Próximamente...</p></div>;
      case 'notas':
        return <div className="placeholder-content"><h2>Notas</h2><p>Próximamente...</p></div>;
      case 'perfil':
        return <div className="placeholder-content"><h2>Mi Perfil</h2><p>Próximamente...</p></div>;
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
        {/* Barra superior del dentista */}
        <div className="dentist-topbar">
          <div className="dentist-topbar-left">
            <div className="doctor-name-topbar">
              <i className="fas fa-user-md"></i>
              <span>Dr. {dentistaInfo?.nombre || 'Cargando...'}</span>
              <span className="doctor-specialty-topbar">- {dentistaInfo?.especialidad || 'Odontología'}</span>
            </div>
          </div>
          <div className="dentist-topbar-right">
            <button className="topbar-icon-btn" title="Configuración" onClick={() => setActiveView('configuracion')}>
              <i className="fas fa-cog"></i>
            </button>
            <button className="topbar-icon-btn" title="Notificaciones">
              <i className="fas fa-bell"></i>
              <span className="notification-badge">3</span>
            </button>
            <div className="profile-dropdown">
              <button className="profile-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
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

      {/* Modal de detalles de cita */}
      {showModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ 
              borderLeftColor: selectedEvent.backgroundColor,
              borderLeftWidth: '4px',
              borderLeftStyle: 'solid'
            }}>
              <h3><i className="fas fa-tooth"></i> Detalles de la cita</h3>
              <button className="modal-close" onClick={closeModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label"><i className="fas fa-user"></i> Paciente:</span>
                <span className="detail-value">{selectedEvent.title}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label"><i className="fas fa-calendar-day"></i> Fecha:</span>
                <span className="detail-value">
                  {new Date(selectedEvent.start).toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label"><i className="fas fa-clock"></i> Hora:</span>
                <span className="detail-value">
                  {new Date(selectedEvent.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(selectedEvent.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label"><i className="fas fa-stethoscope"></i> Motivo:</span>
                <span className="detail-value">{selectedEvent.extendedProps.motivo || 'Consulta general'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label"><i className="fas fa-tag"></i> Estado:</span>
                <span className="detail-badge" style={{ backgroundColor: selectedEvent.backgroundColor }}>
                  {estadoColores[selectedEvent.extendedProps.estado]?.text || selectedEvent.extendedProps.estado}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cerrar</button>
              <button className="btn-primary"><i className="fas fa-edit"></i> Reprogramar</button>
              <button className="btn-danger"><i className="fas fa-trash"></i> Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentistDashboard;