import { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";  // Asegúrate de que este archivo exista y tenga export default
import CreateDentistScreen from "./CreateDentistScreen";  // Asegúrate de que este archivo exista y tenga export default
import SecurityAlertsScreen from "./SecurityAlertsScreen";  // Nueva pantalla de alertas
import "./admin.css";  // Verifica que este archivo CSS exista

export default function AdminLayout({ userData, onLogout }) {
  const [active, setActive] = useState("createDentist");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(3); // Simulación de alertas no leídas

  // Actualizar contador de alertas cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      // Aquí iría la llamada a la API para obtener el número de alertas no leídas
      // Por ahora simulamos un número aleatorio
      setUnreadAlerts(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

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

          <div className="adm-topbar-actions">
            <button
              className="adm-notifications-btn"
              onClick={() => setActive("securityAlerts")}
              title="Alertas de Seguridad"
            >
              <i className="fa-solid fa-bell" />
              {unreadAlerts > 0 && (
                <span className="adm-notification-badge">{unreadAlerts}</span>
              )}
            </button>
          </div>

        </header>

        <section className="adm-content">
          {active === "createDentist" && <CreateDentistScreen />}
          {active === "securityAlerts" && <SecurityAlertsScreen />}
          {/* Aquí puedes agregar más casos para otras pantallas, ej. {active === "otraPantalla" && <OtroComponente />} */}
        </section>
      </main>
    </div>
  );
}