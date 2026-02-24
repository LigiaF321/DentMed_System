import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import GestionarCuentasScreen from "./GestionarCuentasScreen";
import CreateDentistScreen from "../admin/CreateDentistScreen";
import WeeklyAppointmentsChart from "./WeeklyAppointmentsChart";
import HorariosAtencionScreen from "./HorariosAtencionScreen";
import ParametrosSistemaScreen from "./ParametrosSistemaScreen";
import "./dashboard.css";

function Dot({ variant = "info" }) {
  return <span className={`dm2-dot dm2-dot--${variant}`} />;
}

function StatCard({ label, icon, value, variant = "info" }) {
  return (
    <div className="dm2-statcard">
      <div className="dm2-statcard-top">
        <div className="dm2-statcard-label">{label}</div>
        <div className={`dm2-statcard-ico dm2-statcard-ico--${variant}`}>
          <i className={icon} />
        </div>
      </div>
      <div className="dm2-statcard-value">{value}</div>
    </div>
  );
}

function CardSection({ title, children, rightAction }) {
  return (
    <section className="dm2-card">
      <div className="dm2-card-head">
        <div className="dm2-card-title">{title}</div>
        {rightAction ? <div className="dm2-card-action">{rightAction}</div> : null}
      </div>
      <div className="dm2-card-body">{children}</div>
    </section>
  );
}

function parseLocalYMD(ymd) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function normalizeDateLabel(fechaFromApi) {
  if (!fechaFromApi) return "";
  const s = String(fechaFromApi).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = parseLocalYMD(s);
    return d.toLocaleDateString("es-HN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("es-HN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return s;
}

function inventoryLevel(actual, minimo, nivelFromApi) {
  const n = String(nivelFromApi || "").toLowerCase();
  if (n === "critico") return "crit";
  if (n === "alerta") return "warn";

  const a = Number(actual ?? 0);
  const m = Math.max(1, Number(minimo ?? 1));
  const ratio = a / m;
  if (ratio <= 1) return "crit";
  if (ratio <= 1.5) return "warn";
  return "ok";
}

function notifLevel(tipo) {
  const t = String(tipo || "").toLowerCase();
  if (t === "urgente") return "crit";
  if (t === "advertencia") return "warn";
  return "info";
}

export default function DashboardScreen({ userData, onLogout }) {
  const isAdmin = (userData?.role || userData?.rol) === "admin";
  const [adminView, setAdminView] = useState("dashboard");

  const [loading, setLoading] = useState(true);
  const [fechaLabel, setFechaLabel] = useState("");
  const [lastUpdated, setLastUpdated] = useState("—");

  const [query, setQuery] = useState("");

  const [resumen, setResumen] = useState({
    citasHoy: 0,
    pendientes: 0,
    atendidos: 0,
    canceladas: 0,
    consultoriosOcupados: 0,
    consultoriosTotales: 0,
    pacientes: 0,
    profesionales: 0,
  });

  const [weekly, setWeekly] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [notifs, setNotifs] = useState([]);

  const loadPanel = useCallback(async () => {
    try {
      setLoading(true);
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/panel-principal");
      if (!res.ok) throw new Error("No se pudo cargar panel principal");
      const data = await res.json();

      setFechaLabel(normalizeDateLabel(data.fecha));

      const r = data.resumen_dia ?? {};
      setResumen({
        citasHoy: r.citas_totales ?? 0,
        pendientes: r.citas_pendientes ?? 0,
        atendidos: r.citas_atendidas ?? 0,
        canceladas: r.citas_canceladas ?? 0,
        consultoriosOcupados: r.consultorios_ocupados ?? 0,
        consultoriosTotales: r.consultorios_totales ?? 0,
        pacientes: r.pacientes_hoy ?? 0,
        profesionales: r.profesionales_activos ?? 0,
      });

      const etiquetas = data.movimiento_citas?.etiquetas ?? [];
      const datos = data.movimiento_citas?.datos ?? [];
      setWeekly(
        etiquetas.map((label, i) => ({
          day: label,
          count: datos[i] ?? 0,
        }))
      );

      const productos = data.stock_critico?.productos ?? [];
      setStockItems(
        productos.map((p, idx) => ({
          id: idx + 1,
          producto: p.nombre,
          stock_actual: p.stock_actual,
          stock_minimo: p.stock_minimo,
          nivel: p.nivel,
        }))
      );

      setNotifs(
        (data.notificaciones ?? []).map((n, idx) => ({
          id: idx + 1,
          tipo: n.tipo,
          mensaje: n.mensaje,
          accion: n.accion,
        }))
      );

      const ua = data.ultima_actualizacion ? new Date(data.ultima_actualizacion) : null;
      setLastUpdated(
        ua && !Number.isNaN(ua.getTime())
          ? ua.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })
          : "—"
      );
    } catch (e) {
      console.error("Error cargando panel principal:", e);
      setNotifs([{ id: 1, tipo: "urgente", mensaje: "Error cargando panel", accion: "" }]);
      setLastUpdated("—");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadPanel();
  }, [loadPanel]);

  useEffect(() => {
    if (!isAdmin) return;
    const id = setInterval(() => loadPanel(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [isAdmin, loadPanel]);

  const topDate = useMemo(() => {
    if (fechaLabel) return fechaLabel;
    return new Date().toLocaleDateString("es-HN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [fechaLabel]);

  const renderDashboard = () => (
    <div className="dm2-page">
      <div className="dm2-statsRow">
        <StatCard label="Citas hoy" icon="fa-solid fa-calendar-day" value={resumen.citasHoy} variant="info" />
        <StatCard label="Pendientes" icon="fa-solid fa-hourglass-half" value={resumen.pendientes} variant="warn" />
        <StatCard label="Atendidos" icon="fa-solid fa-circle-check" value={resumen.atendidos} variant="ok" />
        <StatCard label="Canceladas" icon="fa-solid fa-xmark" value={resumen.canceladas} variant="crit" />
      </div>

      <div className="dm2-grid">
        <div className="dm2-colLeft">
          <CardSection title="Actividad del día">
            <div className="dm2-miniStats">
              <div className="dm2-miniStat">
                <div className="dm2-miniLabel">Consultorios</div>
                <div className="dm2-miniValue">
                  {resumen.consultoriosTotales
                    ? `${resumen.consultoriosOcupados}/${resumen.consultoriosTotales}`
                    : resumen.consultoriosOcupados}
                </div>
              </div>

              <div className="dm2-miniStat">
                <div className="dm2-miniLabel">Pacientes</div>
                <div className="dm2-miniValue">{resumen.pacientes}</div>
              </div>

              <div className="dm2-miniStat">
                <div className="dm2-miniLabel">Profesionales</div>
                <div className="dm2-miniValue">{resumen.profesionales}</div>
              </div>
            </div>
          </CardSection>

          <CardSection title="Movimiento de citas (últimos 14 días)">
            <div className="dm2-chartWrap">
              <div className="dm2-chartBox">
                <div style={{ height: 290 }} className="dm2-chartInner">
                  <WeeklyAppointmentsChart data={weekly.map(({ day, count }) => ({ day, count }))} />
                </div>
              </div>
            </div>
          </CardSection>

          <CardSection title="Actualización">
            <div className="dm2-updateRow">
              <div className="dm2-updateLeft">
                <span className="dm2-muted">Última actualización:</span>{" "}
                <span className="dm2-strong">{lastUpdated}</span>
              </div>

              <button className="dm2-updateBtn" type="button" onClick={loadPanel} disabled={loading}>
                <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-rotate"}`} />
                <span>{loading ? "ACTUALIZANDO..." : "ACTUALIZAR AHORA"}</span>
              </button>
            </div>

            <div className="dm2-muted">Actualización automática cada 5 minutos</div>
          </CardSection>

          <CardSection title="Accesos rápidos">
            <div className="dm2-quickbar">
              <button className="dm2-quickbtn" type="button" onClick={() => setAdminView("nueva-cita")}>
                <i className="fa-solid fa-plus" /> NUEVA CITA
              </button>

              {/* ✅ CAMBIO: esto debe abrir Crear Cuenta */}
              <button className="dm2-quickbtn" type="button" onClick={() => setAdminView("crear-cuenta")}>
                <i className="fa-solid fa-user-doctor" /> NUEVO DENTISTA
              </button>

              <button className="dm2-quickbtn" type="button" onClick={() => setAdminView("nuevo-producto")}>
                <i className="fa-solid fa-box" /> NUEVO PRODUCTO
              </button>

              <button className="dm2-quickbtn" type="button" onClick={() => setAdminView("configuracion")}>
                <i className="fa-solid fa-gear" /> CONFIGURACIÓN
              </button>
            </div>
          </CardSection>
        </div>

        <div className="dm2-colRight">
          <CardSection
            title="Stock crítico"
            rightAction={
              <button type="button" className="dm2-linkBtn" onClick={() => setAdminView("inventario")}>
                Ver inventario →
              </button>
            }
          >
            <div className="dm2-table">
              <div className="dm2-thead">
                <div>Producto</div>
                <div className="dm2-tcenter">Actual</div>
                <div className="dm2-tcenter">Mínimo</div>
                <div className="dm2-tcenter">Estado</div>
              </div>

              {stockItems.length === 0 ? (
                <div className="dm2-empty">No hay productos en stock crítico</div>
              ) : (
                stockItems.map((it) => {
                  const lvl = inventoryLevel(it.stock_actual, it.stock_minimo, it.nivel);
                  return (
                    <div key={it.id} className="dm2-trow">
                      <div className="dm2-tprod">{it.producto}</div>
                      <div className="dm2-tcenter">{it.stock_actual}</div>
                      <div className="dm2-tcenter">{it.stock_minimo}</div>
                      <div className="dm2-tcenter">
                        <Dot variant={lvl} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardSection>

          <CardSection
            title="Notificaciones"
            rightAction={
              <button type="button" className="dm2-linkBtn" onClick={() => setAdminView("notificaciones")}>
                Ver centro →
              </button>
            }
          >
            <div className="dm2-notifs">
              {notifs.length === 0 ? (
                <div className="dm2-empty">Sin notificaciones</div>
              ) : (
                notifs.map((n) => {
                  const lvl = notifLevel(n.tipo);
                  return (
                    <div
                      key={n.id}
                      className="dm2-notifRow"
                      role={n.accion ? "button" : undefined}
                      tabIndex={n.accion ? 0 : undefined}
                      onClick={() => n.accion && (window.location.href = n.accion)}
                      onKeyDown={(e) => n.accion && e.key === "Enter" && (window.location.href = n.accion)}
                      style={n.accion ? { cursor: "pointer" } : undefined}
                    >
                      <Dot variant={lvl} />
                      <div className="dm2-notifText">
                        <span className="dm2-notifKind">{String(n.tipo || "INFO").toUpperCase()}:</span>{" "}
                        {n.mensaje}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardSection>
        </div>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (isAdmin && adminView === "gestionar-cuentas") return <GestionarCuentasScreen />;

    // ✅ CAMBIO CLAVE: aquí estaba el placeholder
    if (isAdmin && adminView === "crear-cuenta") return <CreateDentistScreen />;

    if (isAdmin && adminView === "horarios") return <HorariosAtencionScreen userData={userData} />;
    if (isAdmin && adminView === "parametros") return <ParametrosSistemaScreen userData={userData} />;

    if (isAdmin && adminView !== "dashboard") {
      return (
        <div className="dm2-page">
          <div className="dm2-card">
            <div className="dm2-card-head">
              <div className="dm2-card-title">Vista: {adminView.toUpperCase()}</div>
              <button className="dm2-linkBtn" type="button" onClick={() => setAdminView("dashboard")}>
                ← Volver al panel de control
              </button>
            </div>
            <div className="dm2-card-body">
              <div className="dm2-empty">...</div>
            </div>
          </div>
        </div>
      );
    }

    return renderDashboard();
  };

  return (
    <div className="dm2-app">
      <div className={`dm2-layout ${isAdmin ? "dm2-layout--withSidebar" : ""}`}>
        {isAdmin ? (
          <AdminSidebar activeView={adminView} onSelect={setAdminView} userData={userData} onLogout={onLogout} />
        ) : null}

        <main className="dm2-main">
          <div className="dm2-topbar">
            <div className="dm2-topbar-left">
              <div className="dm2-topbar-title">PANEL DE CONTROL</div>
              <div className="dm2-topbar-sub">Clínica DentMed</div>
            </div>

            <div className="dm2-topbar-right">
              <div className="dm2-search">
                <i className="fa-solid fa-magnifying-glass dm2-search-ico" />
                <input
                  className="dm2-search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar…"
                  aria-label="Buscar"
                />
              </div>

              <div className="dm2-datePill" title="Fecha">
                {topDate}
              </div>
            </div>
          </div>

          <div className="dm2-content">{renderMainContent()}</div>
        </main>
      </div>
    </div>
  );
}