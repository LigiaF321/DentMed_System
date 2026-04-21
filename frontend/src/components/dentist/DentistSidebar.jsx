import './styles/dentista-global.css';
import React from 'react';
import logoDentMed from '../../assets/dentmed-logo.png';
import { resolveMediaUrl } from '../../utils/media';
import './DentistSidebar.css';

const MENU_ITEMS = [
  { id: 'agenda',       icon: 'fa-calendar-alt',  label: 'Mi Agenda' },
  { id: 'citas',        icon: 'fa-calendar-check', label: 'Citas' },
  { id: 'pacientes',    icon: 'fa-users',          label: 'Mis Pacientes' },
  { id: 'tratamientos', icon: 'fa-tooth',          label: 'Tratamientos' },
  { id: 'notas',        icon: 'fa-sticky-note',    label: 'Notas' },
];
const ESPECIALIDADES = [
  { id: 1, nombre: "Odontología General" },
  { id: 2, nombre: "Ortodoncia" },
  { id: 3, nombre: "Endodoncia" },
  { id: 4, nombre: "Periodoncia" },
  { id: 5, nombre: "Odontopediatría" },
  { id: 6, nombre: "Cirugía Oral" },
  { id: 7, nombre: "Rehabilitación Oral" },
  { id: 8, nombre: "Estética Dental" }
];

const DentistSidebar = ({ activeView, onSelectView, onLogout, userData, dentistaInfo }) => {

  const displayName =
    dentistaInfo?.nombre ||
    userData?.username ||
    userData?.email?.split('@')?.[0] ||
    'Doctor(a)';

  const especialidad =
    dentistaInfo?.especialidad ||
    ESPECIALIDADES.find(e => e.id === dentistaInfo?.id_especialidad)?.nombre ||
    'Odontólogo';

  const userInitial = String(displayName).charAt(0).toUpperCase();
  const avatarUrl = resolveMediaUrl(dentistaInfo?.avatar || userData?.avatar);

  return (
    <aside className="dentist-sidebar">
      <div className="dentist-sidebar-top">
        <div className="dentist-sidebar-logoBox" title="DentMed">
          <img src={logoDentMed} alt="DentMed" className="dentist-sidebar-logoImg" />
        </div>

        <div className="dentist-sidebar-sectionTitle dentista-texto-xxsmall">Menú</div>

        <nav className="dentist-sidebar-nav">
          {MENU_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`dentist-sidebar-item ${isActive ? 'is-active' : ''}`}
                onClick={() => onSelectView(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="dentist-sidebar-ico" aria-hidden="true">
                  <i className={`fa-solid ${item.icon}`} />
                </span>
                <span className="dentist-sidebar-label dentista-texto-normal">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="dentist-sidebar-bottom">
        <button
          className="dentist-sidebar-user dentist-sidebar-user-button"
          type="button"
          onClick={() => onSelectView('perfil')}
          aria-label="Abrir configuración de usuario"
        >
          <div className="dentist-sidebar-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${displayName} avatar`} className="dentist-sidebar-avatar-img" />
            ) : (
              userInitial
            )}
          </div>
          <div className="dentist-sidebar-usertext">
            <div className="dentist-sidebar-username dentista-titulo">Dr. {displayName}</div>
            <div className="dentist-sidebar-role dentista-label">{especialidad}</div>
          </div>
        </button>

        <button className="dentist-sidebar-logout" type="button" onClick={onLogout}>
          <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
};

export default DentistSidebar;