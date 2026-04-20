import React from "react";
import logoDentMed from "../../assets/dentmed-logo.png";
import "./AdminSidebar.css";

const MENU_ITEMS = [
  { id: "dashboard", label: "Panel de control", icon: "fa-chart-line" },
  { id: "consultorios", label: "Consultorios", icon: "fa-door-open", adminOnly: true },
  { id: "crear-cuenta", label: "Crear cuenta", icon: "fa-user-plus" },
  { id: "gestionar-cuentas", label: "Gestionar cuentas", icon: "fa-users" },
  { id: "horarios", label: "Horarios de Atención", icon: "fa-clock" },
  { id: "parametros", label: "Parámetros del Sistema", icon: "fa-sliders" },
  { id: "monitoreo", label: "Monitoreo del Sistema", icon: "fa-chart-area" },
  { id: "auditoria", label: "Auditoría y Actividad", icon: "fa-clipboard-list", adminOnly: true },
  { id: "restauracion", label: "Restauración del Sistema", icon: "fa-database" },
  { id: "catalogo-insumos", label: "Catálogo de Insumos", icon: "fa-boxes-stacked" },
  { id: "kardex-movimientos", label: "Kardex / Movimientos", icon: "fa-right-left" },
  { id: "reportes-consumo", label: "Reportes de Consumo", icon: "fa-chart-column", adminOnly: true },
];

export default function AdminSidebar({
  activeView,
  onSelect,
  onLogout,
  userData,
  alertCount = 0,
}) {
  const currentRole = userData?.role || userData?.rol;

  const firstName = String(userData?.nombre || userData?.username || "").trim().split(" ")[0] || "Admin";
  const firstSurname = String(userData?.apellidos || userData?.apellido || "").trim().split(" ")[0] || "";
  const displayName = firstSurname ? `${firstName} ${firstSurname}` : firstName;

  const userInitial = String(displayName || "A").charAt(0).toUpperCase();
  const roleLabel = currentRole === "admin" ? "Administrador" : "Doctor(a)";
  const avatarUrl = userData?.avatar || null;

  return (
    <aside className="dm2-side">
      <div className="dm2-side-top">
        <div className="dm2-logoBox" title="DentMed">
          <img src={logoDentMed} alt="DentMed" className="dm2-logoImg" />
        </div>

        <div className="dm2-side-sectionTitle">Menú</div>

        <nav className="dm2-side-nav">
          {MENU_ITEMS.map((item) => {
            if (item.adminOnly && currentRole !== "admin") return null;

            const isActive = activeView === item.id;

            const displayLabel =
              item.id === "alertas-seguridad" && alertCount > 0
                ? `${item.label} (${alertCount})`
                : item.label;

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
                <span className="dm2-side-label">{displayLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="dm2-side-bottom">
        <button
          className="dm2-side-user dm2-side-user-button"
          type="button"
          onClick={() => onSelect('perfil')}
          aria-label="Abrir configuración de usuario"
        >
          <div className="dm2-side-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${displayName} avatar`} className="dm2-side-avatar-img" />
            ) : (
              userInitial
            )}
          </div>
          <div className="dm2-side-usertext">
            <div className="dm2-side-username">{displayName}</div>
            <div className="dm2-side-role">{roleLabel}</div>
          </div>
        </button>

        <button className="dm2-side-logout" type="button" onClick={onLogout}>
          <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}