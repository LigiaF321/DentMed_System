import "./DentistDashboard.css";

export default function DentistDashboard({ userData, onLogout }) {
  const fullName = userData?.fullName || userData?.username || "Dentista";
  const especialidad = userData?.especialidad || "—";
  const email = userData?.email || "—";
  const telefono = userData?.telefono || "—";

  return (
    <div className="dd-page">
      <header className="dd-topbar">
        <div className="dd-title">
          DentMed • Panel Dentista
        </div>
        <div className="dd-right">
          <div className="dd-name">Dr. {fullName}</div>
          <button className="dd-logout" onClick={onLogout} type="button">
            <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dd-main">
        <h2 className="dd-welcome">Bienvenido Dr. {fullName}</h2>

        <div className="dd-grid">
          <section className="dd-card">
            <h3>Información personal</h3>
            <div className="dd-row"><span>Especialidad:</span><strong>{especialidad}</strong></div>
            <div className="dd-row"><span>Email:</span><strong>{email}</strong></div>
            <div className="dd-row"><span>Teléfono:</span><strong>{telefono}</strong></div>
          </section>

          <section className="dd-card">
            <h3>Próximas citas</h3>
            <p className="dd-muted">Placeholder: aquí se mostrarán las próximas citas cuando el backend esté listo.</p>
            <div className="dd-placeholder">
              <i className="fa-regular fa-calendar" /> Sin datos por el momento
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
