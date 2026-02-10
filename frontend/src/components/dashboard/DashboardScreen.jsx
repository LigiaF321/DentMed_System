import { useEffect, useMemo, useState } from "react";
import MetricCard from "./MetricCard";
import WeeklyAppointmentsChart from "./WeeklyAppointmentsChart";
import UrgentAlertsList from "./UrgentAlertsList";
import logoDentMed from "../../assets/dentmed-logo.png";
import "./dashboard.css";

const MOCK = {
  metrics: { citasHoy: 14, consultoriosOcupados: 5, inventarioCritico: 3 },
  weekly: [
    { day: "Lun", date: "11 Nov", count: 4 },
    { day: "Mar", date: "12 Nov", count: 5 },
    { day: "Mié", date: "13 Nov", count: 7 },
    { day: "Jue", date: "14 Nov", count: 6 },
    { day: "Vie", date: "15 Nov", count: 4 },
    { day: "Sáb", date: "16 Nov", count: 2 },
    { day: "Dom", date: "17 Nov", count: 1 },
  ],
  activity: [
    { id: 1, type: "ok", title: "Nueva cita registrada", sub: "María López", time: "09:30" },
    { id: 2, type: "info", title: "Paciente confirmó cita", sub: "Carlos Ruiz", time: "09:15" },
    { id: 3, type: "warn", title: "Stock crítico", sub: "Anestesia local", time: "08:45" },
    { id: 4, type: "ok", title: "Tratamiento completado", sub: "Ana Martínez", time: "08:30" },
    { id: 5, type: "info", title: "Consultorio reservado", sub: "Consultorio 2 • 14:00", time: "08:00" },
  ],
  alerts: [
    { id: 1, level: "alta", title: "Cita urgente: dolor agudo", time: "Hace 12 min" },
    { id: 2, level: "media", title: "Inventario bajo: anestesia", time: "Hace 40 min" },
    { id: 3, level: "alta", title: "Paciente reprogramado 3 veces", time: "Hace 1 h" },
  ],
};

function ActivityIcon({ type }) {
  const cls =
    type === "ok"
      ? "fa-solid fa-circle-check"
      : type === "warn"
      ? "fa-solid fa-triangle-exclamation"
      : "fa-solid fa-user-check";

  return (
    <div className={`dm-activity-ico dm-activity-ico-${type}`}>
      <i className={cls} />
    </div>
  );
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(MOCK.metrics);
  const [weekly, setWeekly] = useState(MOCK.weekly);
  const [activity, setActivity] = useState(MOCK.activity);
  const [alerts, setAlerts] = useState(MOCK.alerts);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedDayIdx, setSelectedDayIdx] = useState(2); // destaca "Mié" por defecto

  const subtitle = useMemo(() => {
    if (!lastUpdated) return "Cargando datos...";
    return `Actualizado: ${lastUpdated.toLocaleString()}`;
  }, [lastUpdated]);

  async function loadDashboardData(signal) {
    try {
      // Endpoints para mas adelante
      // const [m, w, a, al] = await Promise.all([
      //   fetch("/api/dashboard/metrics", { signal }).then(r => r.json()),
      //   fetch("/api/dashboard/weekly-appointments", { signal }).then(r => r.json()),
      //   fetch("/api/dashboard/activity", { signal }).then(r => r.json()),
      //   fetch("/api/dashboard/alerts", { signal }).then(r => r.json()),
      // ]);

      const m = MOCK.metrics;
      const w = MOCK.weekly;
      const a = MOCK.activity;
      const al = MOCK.alerts;

      setMetrics(m);
      setWeekly(w);
      setActivity(a);
      setAlerts(al);
      setLastUpdated(new Date());
    } catch (err) {
      if (err?.name !== "AbortError") setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }

  const handleManualRefresh = () => {
    const controller = new AbortController();
    loadDashboardData(controller.signal);
  };

  useEffect(() => {
    const controller = new AbortController();
    loadDashboardData(controller.signal);

    const id = setInterval(() => {
      loadDashboardData(controller.signal);
    }, 300000);

    return () => {
      clearInterval(id);
      controller.abort();
    };
  }, []);

  const selectedDay = weekly[selectedDayIdx];

  return (
    <div className="dm-page">
      {}
<header className="dm-topbar">
  <div className="container dm-topwrap py-3">
    {}
    <div className="dm-toprow">
      {}
      <div className="dm-left">
        <img src={logoDentMed} alt="DentMed" className="dm-logo dm-logo-shift" />
      </div>

      {}
      <div className="dm-right">
        <button className="dm-cta" type="button">
          <i className="fa-solid fa-download me-2" />
          DESCARGAR REPORTES
        </button>

        <div className="dm-userchip">
          <div className="dm-userrole">Administrador</div>
          <div className="dm-avatar">A</div>
        </div>
      </div>
    </div>
  </div>
</header>

      <main className="container py-4">
        {/* GRID estilo Figma: izquierda calendario / derecha actividad */}
        <div className="row g-3">
          {/* IZQUIERDA */}
          <div className="col-12 col-lg-4">
            <div className="dm-card p-3 p-md-4">
              <div className="dm-card-title">
                <i className="fa-solid fa-calendar-week me-2" />
                Calendario semanal
              </div>
              <div className="dm-card-subtitle">
                {selectedDay ? `Seleccionado: ${selectedDay.day} ${selectedDay.date}` : "Selecciona un día"}
              </div>

              <div className="dm-weeklist mt-3">
                {weekly.map((d, idx) => (
                  <button
                    key={`${d.day}-${d.date}`}
                    type="button"
                    className={`dm-dayitem ${idx === selectedDayIdx ? "dm-dayitem-active" : ""}`}
                    onClick={() => setSelectedDayIdx(idx)}
                  >
                    <div>
                      <div className="dm-day">{d.day}</div>
                      <div className="dm-date">{d.date}</div>
                    </div>
                    <div className="dm-count">{d.count} citas</div>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div className="row g-3 mt-1">
              <div className="col-12">
                <MetricCard
                  title="Citas del día"
                  value={metrics.citasHoy}
                  icon="fa-solid fa-calendar-day"
                  hint={loading ? "Cargando..." : "Programadas hoy"}
                />
              </div>

              <div className="col-12">
                <MetricCard
                  title="Consultorios ocupados"
                  value={metrics.consultoriosOcupados}
                  icon="fa-solid fa-hospital-user"
                  hint={loading ? "Cargando..." : "En atención ahora"}
                />
              </div>

              <div className="col-12">
                <MetricCard
                  title="Inventario crítico"
                  value={metrics.inventarioCritico}
                  icon="fa-solid fa-triangle-exclamation"
                  hint={loading ? "Cargando..." : "Items por reponer"}
                  danger
                />
              </div>
            </div>
          </div>

          {}
          <div className="col-12 col-lg-8">
            <div className="dm-card p-3 p-md-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="dm-card-title">
                    <i className="fa-solid fa-clock-rotate-left me-2" />
                    Actividad reciente
                  </div>
                  <div className="dm-card-subtitle">Movimientos del sistema (demo)</div>
                </div>

                <button className="dm-btn dm-btn-sm" type="button" onClick={handleManualRefresh}>
                  <i className="fa-solid fa-rotate me-2" />
                  Actualizar
                </button>
              </div>

              <div className="dm-activity mt-3">
                {activity.map((a) => (
                  <div key={a.id} className="dm-activity-row">
                    <ActivityIcon type={a.type} />
                    <div className="dm-activity-body">
                      <div className="dm-activity-title">{a.title}</div>
                      <div className="dm-activity-sub">{a.sub}</div>
                    </div>
                    <div className="dm-activity-time">{a.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="row g-3 mt-1">
              <div className="col-12 col-xl-8">
                <div className="dm-card p-3 p-md-4 h-100">
                  <div className="dm-card-title">
                    <i className="fa-solid fa-wave-square me-2" />
                    Citas por semana
                  </div>
                  <div className="dm-card-subtitle">Tendencia semanal</div>

                  <div className="mt-3" style={{ height: 280 }}>
                    {}
                    <WeeklyAppointmentsChart data={weekly.map(({ day, count }) => ({ day, count }))} />
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-4">
                <div className="dm-card p-3 p-md-4 h-100">
                  <div className="dm-card-title">
                    <i className="fa-solid fa-bell me-2" />
                    Alertas urgentes
                  </div>
                  <div className="dm-card-subtitle">Prioriza lo importante</div>

                  <div className="mt-3">
                    <UrgentAlertsList alerts={alerts} />
                  </div>

                  <div className="dm-footnote mt-3">Auto-actualiza cada 5 minutos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}