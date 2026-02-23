import React from "react";
import logoDentMed from "../../assets/dentmed-logo.png";
import "./AdminSidebar.css";

const MENU_ITEMS = [
  { id: "dashboard", label: "Panel de control", icon: "fa-chart-line" },
  { id: "crear-cuenta", label: "Crear cuenta", icon: "fa-user-plus" },
  { id: "gestionar-cuentas", label: "Gestionar Cuentas", icon: "fa-users" },
  { id: "horarios", label: "Horarios de Atención", icon: "fa-clock" },
];

export default function AdminSidebar({ activeView, onSelect, onLogout, userData }) {
  const userInitial = userData?.username ? userData.username.charAt(0).toUpperCase() : "A";

  return (
    <aside className="dm2-side">
      <div className="dm2-side-top">
        <div className="dm2-logoBox" title="DentMed">
          <img src={logoDentMed} alt="DentMed" className="dm2-logoImg" />
        </div>

        <div className="dm2-side-sectionTitle">Menú</div>

        <nav className="dm2-side-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dm2-side-item ${activeView === item.id ? "is-active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="dm2-side-ico">
                <i className={`fa-solid ${item.icon}`} />
              </span>
              <span className="dm2-side-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="dm2-side-bottom">
        <button className="dm2-side-logout" type="button" onClick={onLogout}>
          <i className="fa-solid fa-right-from-bracket" />
          <span>Cerrar sesión</span>
        </button>

        <div className="dm2-side-user">
          <div className="dm2-side-avatar">{userInitial}</div>
          <div className="dm2-side-usertext">
            <div className="dm2-side-username">{userData?.username || "Admin"}</div>
            <div className="dm2-side-role">{userData?.role === "admin" ? "Administrador" : "Doctor(a)"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}