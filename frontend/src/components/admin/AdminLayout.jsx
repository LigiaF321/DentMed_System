import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import CreateDentistScreen from "./CreateDentistScreen";
import "./admin.css";

export default function AdminLayout({ userData, onLogout }) {
  const [active, setActive] = useState("createDentist");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="adm-shell">
      <AdminSidebar
        active={active}
        onSelect={(key) => {
          setActive(key);
          setSidebarOpen(false);
        }}
        onLogout={onLogout}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <main className="adm-main">
        <header className="adm-topbar">
          <button
            className="adm-burger"
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <i className="fa-solid fa-bars" />
          </button>

          <div className="adm-topbar-title">
            Panel de Administrador
            <span className="adm-topbar-sub">
              {userData?.username ? ` • ${userData.username}` : ""}
            </span>
          </div>
        </header>

        <section className="adm-content">
          {active === "createDentist" && <CreateDentistScreen />}
        </section>
      </main>
    </div>
  );
}
