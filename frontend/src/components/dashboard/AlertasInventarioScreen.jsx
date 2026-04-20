import { useEffect, useMemo, useState } from "react";
import {
  enviarNotificacionAlertas,
  ejecutarCalculoAlertas,
  getAlertas,
  getConfiguracionAlertas,
  getHistorialNotificaciones,
  getResumenAlertas,
  tratarAlerta,
  tratarAlertasMasivo,
  updateConfiguracionAlertas,
} from "../../services/alertas.service";
import "./AlertasInventarioScreen.css";

function BadgeEstado({ nivel }) {
  const map = {
    critico: {
      label: "CRÍTICO",
      className: "critico",
      icon: "fa-solid fa-circle-exclamation",
    },
    preventivo: {
      label: "ALERTA",
      className: "preventivo",
      icon: "fa-solid fa-triangle-exclamation",
    },
    normal: {
      label: "NORMAL",
      className: "normal",
      icon: "fa-solid fa-circle-check",
    },
  };

  const item = map[nivel] || map.normal;

  return (
    <span className={`alerta-badge ${item.className}`}>
      <i className={item.icon} aria-hidden="true" />
      <span>{item.label}</span>
    </span>
  );
}

function formatearFecha(fecha) {
  if (!fecha) return "-";

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "-";

  const hoy = new Date();
  const mismoDia =
    d.getDate() === hoy.getDate() &&
    d.getMonth() === hoy.getMonth() &&
    d.getFullYear() === hoy.getFullYear();

  const hora = d.toLocaleTimeString("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (mismoDia) return `Hoy ${hora}`;

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

function ordenarAlertas(items, sortBy, sortDir) {
  const list = [...items];

  list.sort((a, b) => {
    let av;
    let bv;

    if (sortBy === "fecha_alerta") {
      av = new Date(a.fecha_alerta || a.updatedAt || 0).getTime();
      bv = new Date(b.fecha_alerta || b.updatedAt || 0).getTime();
    } else if (sortBy === "insumo") {
      av = (a.insumo?.nombre || "").toLowerCase();
      bv = (b.insumo?.nombre || "").toLowerCase();
    } else if (sortBy === "stock_actual") {
      av = Number(a.stock_actual || 0);
      bv = Number(b.stock_actual || 0);
    } else if (sortBy === "stock_minimo") {
      av = Number(a.stock_minimo || 0);
      bv = Number(b.stock_minimo || 0);
    } else if (sortBy === "nivel") {
      const rank = { critico: 1, preventivo: 2, normal: 3 };
      av = rank[a.nivel] || 99;
      bv = rank[b.nivel] || 99;
    } else {
      av = a[sortBy];
      bv = b[sortBy];
    }

    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return list;
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="alertas-modal__backdrop">
      <div className="alertas-modal">
        <div className="alertas-modal__header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="alertas-modal__body">{children}</div>
      </div>
    </div>
  );
}

export default function AlertasInventarioScreen() {
  const [resumen, setResumen] = useState({
    total_criticas: 0,
    total_preventivas: 0,
  });

  const [filtros, setFiltros] = useState({
    nivel: "todos",
    estado: "activas",
    desde: "",
    hasta: "",
    pagina: 1,
    limite: 10,
  });

  const [alertas, setAlertas] = useState([]);
  const [pagination, setPagination] = useState({
    pagina: 1,
    limite: 10,
    totalPaginas: 1,
    total: 0,
  });

  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState("fecha_alerta");
  const [sortDir, setSortDir] = useState("desc");

  const [modalTratarOpen, setModalTratarOpen] = useState(false);
  const [modalConfigOpen, setModalConfigOpen] = useState(false);
  const [alertaActual, setAlertaActual] = useState(null);
  const [notasTratamiento, setNotasTratamiento] = useState("");

  const [config, setConfig] = useState({
    notificaciones_activas: true,
    dia_envio: 1,
    hora_envio: "08:00",
    destinatarios_adicionales: "",
    umbral_preventivo: 20,
  });

  const alertasOrdenadas = useMemo(() => {
    return ordenarAlertas(alertas, sortBy, sortDir);
  }, [alertas, sortBy, sortDir]);

  async function cargarResumen() {
    const res = await getResumenAlertas();
    setResumen(res);
  }

  async function cargarAlertas(customFiltros = filtros) {
    setLoading(true);
    setError("");

    try {
      const res = await getAlertas(customFiltros);
      setAlertas(res.data || []);
      setPagination(
        res.pagination || {
          pagina: 1,
          limite: 10,
          totalPaginas: 1,
          total: 0,
        }
      );
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las alertas");
    } finally {
      setLoading(false);
    }
  }

  async function cargarConfiguracion() {
    try {
      const data = await getConfiguracionAlertas();
      setConfig({
        ...data,
        hora_envio: String(data.hora_envio || "08:00:00").slice(0, 5),
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function cargarHistorial() {
    try {
      const res = await getHistorialNotificaciones({ pagina: 1, limite: 5 });
      setHistorial(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function recargarTodo(customFiltros = filtros) {
    try {
      setMensaje("");
      await Promise.all([
        cargarResumen(),
        cargarAlertas(customFiltros),
        cargarConfiguracion(),
        cargarHistorial(),
      ]);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un problema cargando la pantalla");
    }
  }

  useEffect(() => {
    recargarTodo(filtros);

  }, []);

  async function handleBuscar() {
    const nuevos = { ...filtros, pagina: 1 };
    setFiltros(nuevos);
    await recargarTodo(nuevos);
  }

  async function handleLimpiar() {
    const nuevos = {
      nivel: "todos",
      estado: "activas",
      desde: "",
      hasta: "",
      pagina: 1,
      limite: 10,
    };
    setFiltros(nuevos);
    await recargarTodo(nuevos);
  }

  async function handleCambiarPagina(nuevaPagina) {
    const nuevos = { ...filtros, pagina: nuevaPagina };
    setFiltros(nuevos);
    await cargarAlertas(nuevos);
  }

  function toggleSeleccion(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSeleccionTodas() {
    if (!alertasOrdenadas.length) return;

    if (selectedIds.length === alertasOrdenadas.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(alertasOrdenadas.map((a) => a.id));
  }

  function abrirModalTratar(alerta) {
    setAlertaActual(alerta);
    setNotasTratamiento("");
    setModalTratarOpen(true);
  }

  async function confirmarTratarIndividual() {
    if (!alertaActual) return;

    try {
      await tratarAlerta(alertaActual.id, { notas: notasTratamiento });
      setMensaje("Alerta marcada como tratada");
      setError("");
      setModalTratarOpen(false);
      setAlertaActual(null);
      await recargarTodo(filtros);
    } catch (err) {
      console.error(err);
      setError("No se pudo tratar la alerta");
    }
  }

  async function tratarSeleccionadas() {
    if (!selectedIds.length) return;

    const confirmar = window.confirm(
      `¿Confirmar tratamiento de ${selectedIds.length} alertas seleccionadas?`
    );
    if (!confirmar) return;

    try {
      await tratarAlertasMasivo({
        ids: selectedIds,
        notas: "Tratamiento masivo desde pantalla de alertas",
      });
      setMensaje("Alertas seleccionadas marcadas como tratadas");
      setError("");
      await recargarTodo(filtros);
    } catch (err) {
      console.error(err);
      setError("No se pudieron tratar las alertas seleccionadas");
    }
  }

  async function guardarConfiguracion() {
    try {
      await updateConfiguracionAlertas({
        ...config,
        hora_envio: `${config.hora_envio}:00`,
      });
      setMensaje("Configuración guardada correctamente");
      setError("");
      setModalConfigOpen(false);
      await cargarConfiguracion();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la configuración");
    }
  }

  async function enviarAhora() {
    try {
      await enviarNotificacionAlertas();
      setMensaje("Reporte enviado correctamente");
      setError("");
      await cargarHistorial();
    } catch (err) {
      console.error(err);
      setError("No se pudo enviar el reporte");
    }
  }

  async function ejecutarAhora() {
    try {
      await ejecutarCalculoAlertas();
      setMensaje("Cálculo ejecutado correctamente");
      setError("");
      await recargarTodo(filtros);
    } catch (err) {
      console.error(err);
      setError("No se pudo ejecutar el cálculo");
    }
  }

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDir("asc");
  }

  return (
    <div className="alertas-page">
      <div className="alertas-page__top">
        <div>
          <h1>
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />{" "}
            Alertas de Inventario
          </h1>
          <p>Monitoreo de materiales con stock bajo o crítico</p>
        </div>

        <div className="alertas-page__actions">
          <button type="button" onClick={ejecutarAhora}>
            <i className="fa-solid fa-rotate" aria-hidden="true" />
            <span>Ejecutar ahora</span>
          </button>
          <button type="button" onClick={enviarAhora}>
            <i className="fa-solid fa-paper-plane" aria-hidden="true" />
            <span>Enviar ahora</span>
          </button>
          <button type="button" onClick={() => setModalConfigOpen(true)}>
            <i className="fa-solid fa-gear" aria-hidden="true" />
            <span>Configurar</span>
          </button>
        </div>
      </div>

      <div className="alertas-page__summary">
        <div className="summary-box critico">
          <strong>{resumen.total_criticas}</strong>
          <span>Alertas críticas</span>
        </div>
        <div className="summary-box preventivo">
          <strong>{resumen.total_preventivas}</strong>
          <span>Alertas preventivas</span>
        </div>
      </div>

      {mensaje ? <div className="alertas-message ok">{mensaje}</div> : null}
      {error ? <div className="alertas-message error">{error}</div> : null}

      <section className="alertas-panel">
        <h3>
          <i className="fa-solid fa-filter" aria-hidden="true" /> Filtros
        </h3>

        <div className="alertas-filtros">
          <div>
            <label>Mostrar</label>
            <select
              value={filtros.nivel}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, nivel: e.target.value }))
              }
            >
              <option value="todos">Todas</option>
              <option value="critico">Críticas</option>
              <option value="preventivo">Preventivas</option>
              <option value="normal">Normales</option>
            </select>
          </div>

          <div>
            <label>Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, estado: e.target.value }))
              }
            >
              <option value="activas">Activas</option>
              <option value="tratadas">Tratadas</option>
              <option value="todas">Todas</option>
            </select>
          </div>

          <div>
            <label>Desde</label>
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, desde: e.target.value }))
              }
            />
          </div>

          <div>
            <label>Hasta</label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, hasta: e.target.value }))
              }
            />
          </div>

          <div>
            <label>Por página</label>
            <select
              value={filtros.limite}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  limite: Number(e.target.value),
                }))
              }
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <div className="alertas-filtros__buttons">
          <button type="button" onClick={handleBuscar}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <span>Buscar</span>
          </button>
          <button type="button" className="secondary" onClick={handleLimpiar}>
            <i className="fa-solid fa-eraser" aria-hidden="true" />
            <span>Limpiar</span>
          </button>
        </div>
      </section>

      <section className="alertas-panel">
        <div className="alertas-table__header">
          <h3>
            <i className="fa-solid fa-list" aria-hidden="true" /> Listado de Alertas
          </h3>

        </div>

        {loading ? (
          <p>Cargando alertas...</p>
        ) : (
          <div className="alertas-table__wrapper">
            <table className="alertas-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        alertasOrdenadas.length > 0 &&
                        selectedIds.length === alertasOrdenadas.length
                      }
                      onChange={toggleSeleccionTodas}
                    />
                  </th>
                  <th onClick={() => handleSort("fecha_alerta")}>Fecha</th>
                  <th onClick={() => handleSort("insumo")}>Insumo</th>
                  <th onClick={() => handleSort("stock_actual")}>Actual</th>
                  <th onClick={() => handleSort("stock_minimo")}>Mínimo</th>
                  <th>Faltan</th>
                  <th onClick={() => handleSort("nivel")}>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {alertasOrdenadas.length ? (
                  alertasOrdenadas.map((alerta) => (
                    <tr key={alerta.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(alerta.id)}
                          onChange={() => toggleSeleccion(alerta.id)}
                        />
                      </td>
                      <td>{formatearFecha(alerta.fecha_alerta)}</td>
                      <td>
                        <div className="insumo-cell">
                          <strong>{alerta.insumo?.nombre || "Insumo"}</strong>
                          <span>
                            {alerta.insumo?.unidad_medida || "unidades"}
                          </span>
                        </div>
                      </td>
                      <td>{alerta.stock_actual}</td>
                      <td>{alerta.stock_minimo}</td>
                      <td>{getFaltante(alerta)}</td>
                      <td>
                        <BadgeEstado nivel={alerta.nivel} />
                      </td>
                      <td>
                        {alerta.activa ? (
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => abrirModalTratar(alerta)}
                            title="Marcar como tratada"
                          >
                            <i className="fa-solid fa-check" aria-hidden="true" />
                          </button>
                        ) : (
                          <span className="tratada-text">
                            Tratada {formatearFecha(alerta.fecha_tratada)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-cell">
                      No hay alertas para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="alertas-pagination">
          <button
            type="button"
            disabled={pagination.pagina <= 1}
            onClick={() => handleCambiarPagina((pagination.pagina || 1) - 1)}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>

          <span>
            Página {pagination.pagina || 1} de {pagination.totalPaginas || 1}
          </span>

          <button
            type="button"
            disabled={(pagination.pagina || 1) >= (pagination.totalPaginas || 1)}
            onClick={() => handleCambiarPagina((pagination.pagina || 1) + 1)}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="alertas-panel">
        <h3>
          <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Historial
          de notificaciones
        </h3>

        <div className="alertas-table__wrapper">
          <table className="alertas-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Destinatarios</th>
                <th>Total</th>
                <th>Críticas</th>
                <th>Preventivas</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {historial.length ? (
                historial.map((item) => (
                  <tr key={item.id}>
                    <td>{formatearFecha(item.fecha_envio)}</td>
                    <td className="historial-dest">{item.destinatarios}</td>
                    <td>{item.total_alertas}</td>
                    <td>{item.criticas}</td>
                    <td>{item.preventivas}</td>
                    <td>{item.resultado}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    Aún no hay envíos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="alertas-legend">
        <span>
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> Crítico
          (debajo del mínimo)
        </span>
        <span>
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Alerta
          (cerca del mínimo)
        </span>
        <span>
          <i className="fa-solid fa-circle-check" aria-hidden="true" /> Normal
        </span>
      </div>

      <Modal
        open={modalTratarOpen}
        title="Marcar alerta como tratada"
        onClose={() => setModalTratarOpen(false)}
      >
        <p>
          Confirmar que ha gestionado el stock de{" "}
          <strong>{alertaActual?.insumo?.nombre || "este insumo"}</strong>.
        </p>

        <label className="modal-field">
          Notas opcionales
          <textarea
            rows="4"
            placeholder="Ej: Pedido realizado a proveedor"
            value={notasTratamiento}
            onChange={(e) => setNotasTratamiento(e.target.value)}
          />
        </label>

        <div className="alertas-modal__actions">
          <button
            type="button"
            className="success"
            onClick={confirmarTratarIndividual}
          >
            <i className="fa-solid fa-check" aria-hidden="true" />
            <span>Marcar como tratada</span>
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setModalTratarOpen(false)}
          >
            <i className="fa-solid fa-ban" aria-hidden="true" />
            <span>Cancelar</span>
          </button>
        </div>
      </Modal>

      <Modal
        open={modalConfigOpen}
        title="Configuración de Alertas"
        onClose={() => setModalConfigOpen(false)}
      >
        <div className="config-grid">
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={config.notificaciones_activas}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  notificaciones_activas: e.target.checked,
                }))
              }
            />
            Activar notificaciones semanales
          </label>

          <label>
            Día de envío
            <select
              value={config.dia_envio}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  dia_envio: Number(e.target.value),
                }))
              }
            >
              <option value={1}>Lunes</option>
              <option value={2}>Martes</option>
              <option value={3}>Miércoles</option>
              <option value={4}>Jueves</option>
              <option value={5}>Viernes</option>
              <option value={6}>Sábado</option>
              <option value={7}>Domingo</option>
            </select>
          </label>

          <label>
            Hora
            <input
              type="time"
              value={config.hora_envio}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, hora_envio: e.target.value }))
              }
            />
          </label>

          <label>
            Correos adicionales
            <textarea
              rows="3"
              placeholder="correo1@demo.com, correo2@demo.com"
              value={config.destinatarios_adicionales || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  destinatarios_adicionales: e.target.value,
                }))
              }
            />
          </label>

          <div className="config-info">
            <p>
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{" "}
              Alerta crítica: Stock actual menor que Stock mínimo
            </p>
            <label>
              Umbral preventivo (%)
              <input
                type="number"
                min="0"
                max="100"
                value={config.umbral_preventivo}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    umbral_preventivo: Number(e.target.value),
                  }))
                }
              />
            </label>
          </div>
        </div>

        <div className="alertas-modal__actions">
          <button type="button" className="success" onClick={guardarConfiguracion}>
            <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
            <span>Guardar configuración</span>
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setModalConfigOpen(false)}
          >
            <i className="fa-solid fa-ban" aria-hidden="true" />
            <span>Cancelar</span>
          </button>
        </div>
      </Modal>
    </div>
  );
}