// frontend/src/components/dentist/DentistSidebar.jsx
import React from 'react';
import './DentistSidebar.css';

const DentistSidebar = ({ activeView, onSelectView, onLogout }) => {
  const menuItems = [
    { id: 'agenda', icon: 'fa-calendar-alt', label: 'Mi Agenda' },
    { id: 'pacientes', icon: 'fa-users', label: 'Mis Pacientes' },
    { id: 'tratamientos', icon: 'fa-tooth', label: 'Tratamientos' },
    { id: 'notas', icon: 'fa-sticky-note', label: 'Notas' },
  ];

  return (
    <aside className="dentist-sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <i className="fas fa-tooth"></i>
        </div>
        <div className="logo-text">
          <span className="logo-dent">Dent</span>
          <span className="logo-med">Med</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onSelectView(item.id)}
          >
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-logout">
        <button className="logout-btn-sidebar" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
};

export default DentistSidebar;