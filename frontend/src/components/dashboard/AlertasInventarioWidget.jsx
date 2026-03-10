import { useEffect, useState } from "react";
import { getResumenAlertas } from "../../services/alertas.service";
import "./AlertasInventarioWidget.css";

function formatearFecha(fecha) {
  if (!fecha) return "Sin actualización";

  const d = new Date(fecha);
  return d.toLocaleString("es-HN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getFaltante(alerta) {
  const actual = Number(alerta?.stock_actual ?? 0);
  const minimo = Number(alerta?.stock_minimo ?? 0);
  return Math.max(minimo - actual, 0);
}

function renderNivel(nivel) {
  if (nivel === "critico") {
    return {
      icon: "fa-solid fa-circle-exclamation",
      text: "Crítica",
      className: "critico",
    };
  }

  if (nivel === "preventivo") {
    return {
      icon: "fa-solid fa-triangle-exclamation",
      text: "Preventiva",
      className: "preventivo",
    };
  }

  return {
    icon: "fa-solid fa-circle-check",
    text: "Normal",
    className: "normal",
  };
}

export default function AlertasInventarioWidget({ onViewAll }) {
  const [data, setData] = useState({
    total_criticas: 0,
    total_preventivas: 0,
    lista: [],
    ultima_actualizacion: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargarResumen() {
    try {
      setError("");
      const res = await getResumenAlertas();
      setData(res);
    } catch (err) {
      setError("No se pudo cargar el resumen de alertas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarResumen();

    const interval = setInterval(() => {
      cargarResumen();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="alertas-widget">
      <div className="alertas-widget__header">
        <div className="alertas-widget__titleBox">
          <div className="alertas-widget__title">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            <span>Alertas de Inventario</span>
          </div>
          <div className="alertas-widget__subtitle">
            Monitoreo de stock bajo o crítico
          </div>
        </div>

        <button className="alertas-widget__link" onClick={onViewAll} type="button">
          <i className="fa-solid fa-list" aria-hidden="true" />
          <span>Ver todas</span>
        </button>
      </div>

      <div className="alertas-widget__body">
        <div className="alertas-widget__summary">
          <div className="alertas-widget__card critico">
            <strong>{data.total_criticas}</strong>
            <span>Críticas</span>
          </div>

          <div className="alertas-widget__card preventivo">
            <strong>{data.total_preventivas}</strong>
            <span>Preventivas</span>
          </div>
        </div>

        {loading ? (
          <div className="alertas-widget__status">Cargando alertas...</div>
        ) : error ? (
          <div className="alertas-widget__status error">{error}</div>
        ) : data.lista?.length ? (
          <ul className="alertas-widget__list">
            {data.lista.map((alerta) => {
              const nivel = renderNivel(alerta.nivel);
              const nombre = alerta.insumo?.nombre || "Insumo";
              const faltan = getFaltante(alerta);

              return (
                <li key={alerta.id} className="alertas-widget__item">
                  <div className="alertas-widget__item-top">
                    <span className={`alertas-widget__badge ${nivel.className}`}>
                      <i className={nivel.icon} aria-hidden="true" />
                      <span>{nivel.text}</span>
                    </span>
                    <strong>{nombre}</strong>
                  </div>

                  <div className="alertas-widget__meta">
                    <span>Actual: <b>{alerta.stock_actual}</b></span>
                    <span>Mínimo: <b>{alerta.stock_minimo}</b></span>
                    <span>Faltan: <b>{faltan}</b></span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="alertas-widget__status ok">
            No hay alertas activas por ahora.
          </div>
        )}

        <div className="alertas-widget__footer">
          Última actualización: {formatearFecha(data.ultima_actualizacion)}
        </div>
      </div>
    </section>
  );
}