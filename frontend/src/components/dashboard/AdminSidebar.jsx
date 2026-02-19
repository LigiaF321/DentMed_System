import React from "react";
import "./AdminSidebar.css";

const MENU_ITEMS = [
  { id: "dashboard", label: "Inicio", icon: "fa-home" },
  { id: "crear-cuenta", label: "Crear cuenta", icon: "fa-user-plus" },
  { id: "gestionar-cuentas", label: "Gestionar Cuentas", icon: "fa-users" },
];

export default function AdminSidebar({ activeView, onSelect }) {
  return (
    <aside className="dm-sidebar">
      <div className="dm-sidebar-header">
        <i className="fa-solid fa-gear me-2" />
        <span>Administración</span>
      </div>
      <nav className="dm-sidebar-nav">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`dm-sidebar-item ${activeView === item.id ? "dm-sidebar-item-active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <i className={`fa-solid ${item.icon} dm-sidebar-icon`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
