import { useState } from "react";
import AdminSidebar from "./AdminSidebar";  // Asegúrate de que este archivo exista y tenga export default
import CreateDentistScreen from "./CreateDentistScreen";  // Asegúrate de que este archivo exista y tenga export default
import "./admin.css";  // Verifica que este archivo CSS exista

export default function AdminLayout({ userData, onLogout }) {
  const [active, setActive] = useState("createDentist");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Validación básica para evitar errores si userData es null
  if (!userData) {
    return <div>Error: No se encontraron datos de usuario.</div>;
  }

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
    {userData?.username ? ` • ${userData.username}` : ""} • HU-DM02
  </span>
</div>

        </header>

        <section className="adm-content">
          {active === "createDentist" && <CreateDentistScreen />}
          {/* Aquí puedes agregar más casos para otras pantallas, ej. {active === "otraPantalla" && <OtroComponente />} */}
        </section>
      </main>
    </div>
  );
}