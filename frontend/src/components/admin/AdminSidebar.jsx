import React, { useState } from 'react';
import './admin.css';

function AdminSidebar({
  active,
  onSelect,
  onLogout,
  sidebarOpen,
  onToggleSidebar,
}) {
  const [unreadAlerts, setUnreadAlerts] = useState(3); // Simulación de alertas no leídas

  // Menú de opciones
  const menuItems = [
    {
      id: 'createDentist',
      label: 'Crear Dentista',
      icon: '👨‍⚕️',
      badge: null,
    },
    {
      id: 'securityAlerts',
      label: 'Alertas de Seguridad',
      icon: '🔔',
      badge: unreadAlerts > 0 ? unreadAlerts : null,
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: '📊',
      badge: null,
    },
  ];

  return (
    <>
      {/* Overlay para cerrar sidebar en móvil */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={onToggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">🏥 Admin Panel</h2>
          <button
            className="sidebar-close"
            onClick={onToggleSidebar}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${active === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
              title={item.label}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {item.badge && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={onLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
