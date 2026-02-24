import React from "react";
import logoDentMed from "../../assets/dentmed-logo.png";
import "./AdminSidebar.css";

const MENU_ITEMS = [
  { id: "dashboard", label: "Panel de control", icon: "fa-chart-line" },
  { id: "crear-cuenta", label: "Crear cuenta", icon: "fa-user-plus" },
  { id: "gestionar-cuentas", label: "Gestionar cuentas", icon: "fa-users" },
  { id: "horarios", label: "Horarios de Atención", icon: "fa-clock" },
  { id: "parametros", label: "Parámetros del Sistema", icon: "fa-sliders" },
];

export default function AdminSidebar({ activeView, onSelect, onLogout, userData }) {
  const name =
    userData?.username ||
    userData?.email?.split("@")?.[0] ||
    (userData?.role === "admin" ? "Admin" : "Doctor(a)");

  const userInitial = String(name || "A").charAt(0).toUpperCase();
  const roleLabel = userData?.role === "admin" ? "Administrador" : "Doctor(a)";

  return (
    <aside className="dm2-side">
      <div className="dm2-side-top">
        <div className="dm2-logoBox" title="DentMed">
          <img src={logoDentMed} alt="DentMed" className="dm2-logoImg" />
        </div>

        <div className="dm2-side-sectionTitle">Menú</div>

        <nav className="dm2-side-nav">
          {MENU_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`dm2-side-item ${isActive ? "is-active" : ""}`}
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="dm2-side-ico" aria-hidden="true">
                  <i className={`fa-solid ${item.icon}`} />
                </span>
                <span className="dm2-side-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="dm2-side-bottom">
        <div className="dm2-side-user">
          <div className="dm2-side-avatar">{userInitial}</div>
          <div className="dm2-side-usertext">
            <div className="dm2-side-username">{name}</div>
            <div className="dm2-side-role">{roleLabel}</div>
          </div>
        </div>

        <button className="dm2-side-logout" type="button" onClick={onLogout}>
          <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}