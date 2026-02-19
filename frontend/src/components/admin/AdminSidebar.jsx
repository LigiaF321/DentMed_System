import logoDentMed from "../../assets/dentmed-logo.png";
import "./admin.css";

export default function AdminSidebar({
  active,
  onSelect,
  onLogout,
  sidebarOpen,
  onToggleSidebar,
}) {
  return (
    <>
      {/* overlay móvil */}
      <div
        className={`adm-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={onToggleSidebar}
      />

      <aside className={`adm-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="adm-brand">
          <img src={logoDentMed} alt="DentMed" className="adm-logo" />
          <div className="adm-brand-text">
            <div className="adm-brand-title">DentMed</div>
            <div className="adm-brand-sub">Administración</div>
          </div>
        </div>

        <nav className="adm-nav">
          <button
            type="button"
            className={`adm-nav-item ${active === "createDentist" ? "active" : ""}`}
            onClick={() => onSelect("createDentist")}
          >
            <i className="fa-solid fa-user-plus" />
            <span>Crear cuenta de dentista</span>
          </button>
        </nav>

        <div className="adm-sidebar-footer">
          <button type="button" className="adm-logout" onClick={onLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
