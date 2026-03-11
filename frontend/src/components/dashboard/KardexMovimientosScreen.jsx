import { useEffect, useMemo, useState } from "react";
import {
  buscarInsumos,
  eliminarMovimiento,
  exportarMovimientos,
  getMovimientos,
  getResumenInsumo,
  registrarAjuste,
  registrarEntrada,
  registrarSalida,
  validarSalida,
} from "../../services/kardex.service";
import "./KardexMovimientosScreen.css";

function formatearFecha(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-HN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function money(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2,
  }).format(n);
}

function BadgeTipo({ tipo }) {
  const map = {
    entrada: { cls: "ok", icon: "fa-arrow-down", label: "Entrada" },
    salida: { cls: "crit", icon: "fa-arrow-up", label: "Salida" },
    ajuste: { cls: "warn", icon: "fa-sliders", label: "Ajuste" },
  };
  const item = map[tipo] || { cls: "info", icon: "fa-circle", label: tipo || "-" };

  return (
    <span className={`kdx-badge kdx-badge--${item.cls}`}>
      <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
      <span>{item.label}</span>
    </span>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="kdx-modalBackdrop">
      <div className="kdx-modal">
        <div className="kdx-modalHead">
          <div className="kdx-modalTitle">{title}</div>
          <button type="button" className="kdx-iconBtn" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="kdx-modalBody">{children}</div>
      </div>
    </div>
  );
}

function InsumoPicker({
  value,
  onChange,
  label = "Insumo",
  disabled = false,
}) {
  const [query, setQuery] = useState(value?.nombre || "");
  const [resultados, setResultados] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value?.nombre || "");
  }, [value]);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const data = await buscarInsumos(query);
        if (active) setResultados(data || []);
      } catch {
        if (active) setResultados([]);
      }
    }

    if (!disabled) {
      run();
    }

    return () => {
      active = false;
    };
  }, [query, disabled]);

  return (
    <div className="kdx-field">
      <label>{label}</label>
      <div className="kdx-picker">
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder="Buscar por nombre o código"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) onChange(null);
          }}
        />
        {open && !disabled ? (
          <div className="kdx-pickerList">
            {resultados.length ? (
              resultados.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="kdx-pickerItem"
                  onClick={() => {
                    onChange(item);
                    setQuery(item.nombre);
                    setOpen(false);
                  }}
                >
                  <div className="kdx-pickerName">
                    {item.nombre}
                    {item.codigo ? ` (${item.codigo})` : ""}
                  </div>
                  <div className="kdx-pickerMeta">
                    Stock: {item.cantidad_actual} · Min: {item.stock_minimo}
                  </div>
                </button>
              ))
            ) : (
              <div className="kdx-pickerEmpty">Sin resultados</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EntradaModal({ open, onClose, onSaved }) {
  const [insumo, setInsumo] = useState(null);
  const [payload, setPayload] = useState({
    cantidad: "",
    costo_unitario: "",
    fecha: "",
    proveedor: "",
    factura: "",
    notas: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!insumo?.id) throw new Error("Selecciona un insumo");

      await registrarEntrada({
        insumo_id: insumo.id,
        ...payload,
      });

      onSaved("Entrada registrada correctamente");
      onClose();
      setInsumo(null);
      setPayload({
        cantidad: "",
        costo_unitario: "",
        fecha: "",
        proveedor: "",
        factura: "",
        notas: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Registrar Entrada" onClose={onClose}>
      <form className="kdx-formGrid" onSubmit={handleSubmit}>
        <InsumoPicker value={insumo} onChange={setInsumo} />

        <div className="kdx-field">
          <label>Cantidad</label>
          <input
            type="number"
            min="1"
            value={payload.cantidad}
            onChange={(e) => setPayload((p) => ({ ...p, cantidad: e.target.value }))}
          />
        </div>

        <div className="kdx-field">
          <label>Costo unitario</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={payload.costo_unitario}
            onChange={(e) => setPayload((p) => ({ ...p, costo_unitario: e.target.value }))}
          />
        </div>

        <div className="kdx-field">
          <label>Fecha</label>
          <input
            type="datetime-local"
            value={payload.fecha}
            onChange={(e) => setPayload((p) => ({ ...p, fecha: e.target.value }))}
          />
        </div>

        <div className="kdx-field">
          <label>Proveedor</label>
          <input
            type="text"
            value={payload.proveedor}
            onChange={(e) => setPayload((p) => ({ ...p, proveedor: e.target.value }))}
          />
        </div>

        <div className="kdx-field">
          <label>Factura</label>
          <input
            type="text"
            value={payload.factura}
            onChange={(e) => setPayload((p) => ({ ...p, factura: e.target.value }))}
          />
        </div>

        <div className="kdx-field kdx-field--full">
          <label>Notas</label>
          <textarea
            rows="3"
            value={payload.notas}
            onChange={(e) => setPayload((p) => ({ ...p, notas: e.target.value }))}
          />
        </div>

        {error ? <div className="kdx-error">{error}</div> : null}

        <div className="kdx-actions">
          <button type="submit" className="kdx-btn kdx-btn--primary" disabled={saving}>
            <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
            <span>{saving ? "Guardando..." : "Registrar entrada"}</span>
          </button>
          <button type="button" className="kdx-btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SalidaModal({ open, onClose, onSaved }) {
  const [insumo, setInsumo] = useState(null);
  const [validacion, setValidacion] = useState(null);
  const [payload, setPayload] = useState({
    cantidad: "",
    fecha: "",
    tipo_salida: "tratamiento",
    id_cita: "",
    id_doctor: "",
    motivo: "",
    notas: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        if (!insumo?.id || !payload.cantidad) {
          if (active) setValidacion(null);
          return;
        }

        const data = await validarSalida({
          insumo_id: insumo.id,
          cantidad: payload.cantidad,
        });

        if (active) setValidacion(data);
      } catch {
        if (active) setValidacion(null);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [insumo, payload.cantidad]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!insumo?.id) throw new Error("Selecciona un insumo");
      if (validacion && !validacion.disponible) {
        throw new Error(`Stock insuficiente. Stock actual: ${validacion.stock_actual}`);
      }

      await registrarSalida({
        insumo_id: insumo.id,
        ...payload,
      });

      onSaved("Salida registrada correctamente");
      onClose();
      setInsumo(null);
      setValidacion(null);
      setPayload({
        cantidad: "",
        fecha: "",
        tipo_salida: "tratamiento",
        id_cita: "",
        id_doctor: "",
        motivo: "",
        notas: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Registrar Salida" onClose={onClose}>
      <form className="kdx-formGrid" onSubmit={handleSubmit}>
        <InsumoPicker value={insumo} onChange={setInsumo} />

        <div className="kdx-field">
          <label>Cantidad</label>
          <input
            type="number"
            min="1"
            value={payload.cantidad}
            onChange={(e) => setPayload((p) => ({ ...p, cantidad: e.target.value }))}
          />
          {validacion ? (
            <small className={validacion.disponible ? "kdx-help kdx-help--ok" : "kdx-help kdx-help--crit"}>
              Stock actual: {validacion.stock_actual}
            </small>
          ) : null}
        </div>

        <div className="kdx-field">
          <label>Tipo de salida</label>
          <select
            value={payload.tipo_salida}
            onChange={(e) => setPayload((p) => ({ ...p, tipo_salida: e.target.value }))}
          >
            <option value="tratamiento">Tratamiento</option>
            <option value="merma">Merma</option>
            <option value="consumo_interno">Consumo interno</option>
          </select>
        </div>

        <div className="kdx-field">
          <label>Fecha</label>
          <input
            type="datetime-local"
            value={payload.fecha}
            onChange={(e) => setPayload((p) => ({ ...p, fecha: e.target.value }))}
          />
        </div>

        <div className="kdx-field">
          <label>ID Cita</label>
          <input
            type="number"
            min="1"
            value={payload.id_cita}
            onChange={(e) => setPayload((p) => ({ ...p, id_cita: e.target.value }))}
          />
        </div>

        <div className="kdx-field">
          <label>ID Doctor</label>
          <input
            type="number"
            min="1"
            value={payload.id_doctor}
            onChange={(e) => setPayload((p) => ({ ...p, id_doctor: e.target.value }))}
          />
        </div>

        <div className="kdx-field">
          <label>Motivo</label>
          <input
            type="text"
            value={payload.motivo}
            onChange={(e) => setPayload((p) => ({ ...p, motivo: e.target.value }))}
          />
        </div>

        <div className="kdx-field kdx-field--full">
          <label>Notas</label>
          <textarea
            rows="3"
            value={payload.notas}
            onChange={(e) => setPayload((p) => ({ ...p, notas: e.target.value }))}
          />
        </div>

        {error ? <div className="kdx-error">{error}</div> : null}

        <div className="kdx-actions">
          <button type="submit" className="kdx-btn kdx-btn--primary" disabled={saving}>
            <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
            <span>{saving ? "Guardando..." : "Registrar salida"}</span>
          </button>
          <button type="button" className="kdx-btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AjusteModal({ open, onClose, onSaved }) {
  const [insumo, setInsumo] = useState(null);
  const [payload, setPayload] = useState({
    cantidad: "",
    tipo_ajuste: "incremento",
    fecha: "",
    motivo: "",
    notas: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!insumo?.id) throw new Error("Selecciona un insumo");
      if (!payload.motivo.trim()) throw new Error("El motivo es obligatorio");

      await registrarAjuste({
        insumo_id: insumo.id,
        ...payload,
      });

      onSaved("Ajuste registrado correctamente");
      onClose();
      setInsumo(null);
      setPayload({
        cantidad: "",
        tipo_ajuste: "incremento",
        fecha: "",
        motivo: "",
        notas: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Registrar Ajuste" onClose={onClose}>
      <form className="kdx-formGrid" onSubmit={handleSubmit}>
        <InsumoPicker value={insumo} onChange={setInsumo} />

        <div className="kdx-field">
          <label>Tipo de ajuste</label>
          <select
            value={payload.tipo_ajuste}
            onChange={(e) => setPayload((p) => ({ ...p, tipo_ajuste: e.target.value }))}
          >
            <option value="incremento">Incrementar stock</option>
            <option value="decremento">Disminuir stock</option>
          </select>
        </div>

        <div className="kdx-field">
          <label>Cantidad</label>
          <input
            type="number"
            min="1"
            value={payload.cantidad}
            onChange={(e) => setPayload((p) => ({ ...p, cantidad: e.target.value }))}
          />
        </div>

        <div className="kdx-field">
          <label>Fecha</label>
          <input
            type="datetime-local"
            value={payload.fecha}
            onChange={(e) => setPayload((p) => ({ ...p, fecha: e.target.value }))}
          />
        </div>

        <div className="kdx-field kdx-field--full">
          <label>Motivo</label>
          <input
            type="text"
            placeholder="Ej: Error de conteo, producto vencido, etc."
            value={payload.motivo}
            onChange={(e) => setPayload((p) => ({ ...p, motivo: e.target.value }))}
          />
        </div>

        <div className="kdx-field kdx-field--full">
          <label>Notas</label>
          <textarea
            rows="3"
            value={payload.notas}
            onChange={(e) => setPayload((p) => ({ ...p, notas: e.target.value }))}
          />
        </div>

        {error ? <div className="kdx-error">{error}</div> : null}

        <div className="kdx-actions">
          <button type="submit" className="kdx-btn kdx-btn--primary" disabled={saving}>
            <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
            <span>{saving ? "Guardando..." : "Registrar ajuste"}</span>
          </button>
          <button type="button" className="kdx-btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EliminarMovimientoModal({ open, movimiento, onClose, onSaved, isAdmin }) {
  const [justificacion, setJustificacion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isAdmin) return null;

  async function handleDelete() {
    setSaving(true);
    setError("");

    try {
      await eliminarMovimiento(movimiento.id, justificacion);
      onSaved("Movimiento eliminado correctamente");
      setJustificacion("");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Eliminar Movimiento" onClose={onClose}>
      {movimiento ? (
        <div className="kdx-deleteBox">
          <div className="kdx-warning">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            <div>
              Esta acción revertirá el movimiento y afectará el stock actual.
            </div>
          </div>

          <div className="kdx-deleteInfo">
            <div><strong>Fecha:</strong> {formatearFecha(movimiento.fecha_movimiento)}</div>
            <div><strong>Tipo:</strong> {movimiento.tipo_movimiento}</div>
            <div><strong>Insumo:</strong> {movimiento.insumo?.nombre || "-"}</div>
            <div><strong>Cantidad:</strong> {movimiento.cantidad}</div>
            <div><strong>Stock antes:</strong> {movimiento.stock_antes}</div>
            <div><strong>Stock después:</strong> {movimiento.stock_despues}</div>
          </div>

          <div className="kdx-field">
            <label>Justificación de la eliminación</label>
            <textarea
              rows="4"
              placeholder="Ej: Error en factura, duplicado, etc."
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
            />
          </div>

          {error ? <div className="kdx-error">{error}</div> : null}

          <div className="kdx-actions">
            <button
              type="button"
              className="kdx-btn kdx-btn--danger"
              disabled={!justificacion.trim() || saving}
              onClick={handleDelete}
            >
              <i className="fa-solid fa-trash" aria-hidden="true" />
              <span>{saving ? "Eliminando..." : "Sí, eliminar movimiento"}</span>
            </button>
            <button type="button" className="kdx-btn" onClick={onClose}>
              No, cancelar
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default function KardexMovimientosScreen({ userData }) {
  const isAdmin = (userData?.role || userData?.rol) === "admin";

  const [filtros, setFiltros] = useState({
    insumo_id: "",
    tipo_movimiento: "todos",
    fecha_desde: "",
    fecha_hasta: "",
    pagina: 1,
    limite: 10,
  });

  const [insumoFiltro, setInsumoFiltro] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [pagination, setPagination] = useState({
    pagina: 1,
    limite: 10,
    totalPaginas: 1,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [openEntrada, setOpenEntrada] = useState(false);
  const [openSalida, setOpenSalida] = useState(false);
  const [openAjuste, setOpenAjuste] = useState(false);
  const [openEliminar, setOpenEliminar] = useState(false);
  const [movimientoEliminar, setMovimientoEliminar] = useState(null);

  const filtrosActivos = useMemo(
    () => ({
      ...filtros,
      insumo_id: insumoFiltro?.id || filtros.insumo_id || "",
    }),
    [filtros, insumoFiltro]
  );

  async function cargarMovimientos(custom = filtrosActivos) {
    setLoading(true);
    setError("");

    try {
      const data = await getMovimientos(custom);
      setMovimientos(data.data || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function cargarResumen(insumoId) {
    if (!insumoId) {
      setResumen(null);
      return;
    }

    try {
      const data = await getResumenInsumo(insumoId);
      setResumen(data);
    } catch {
      setResumen(null);
    }
  }

  async function recargarTodo(custom = filtrosActivos) {
    await cargarMovimientos(custom);
    await cargarResumen(custom.insumo_id);
  }

  useEffect(() => {
    recargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBuscar() {
    const next = {
      ...filtrosActivos,
      pagina: 1,
    };
    setFiltros((f) => ({ ...f, pagina: 1 }));
    await recargarTodo(next);
  }

  async function handleLimpiar() {
    const next = {
      insumo_id: "",
      tipo_movimiento: "todos",
      fecha_desde: "",
      fecha_hasta: "",
      pagina: 1,
      limite: 10,
    };
    setInsumoFiltro(null);
    setFiltros(next);
    await recargarTodo(next);
  }

  async function handlePageChange(pagina) {
    const next = { ...filtrosActivos, pagina };
    setFiltros((f) => ({ ...f, pagina }));
    await cargarMovimientos(next);
  }

  async function handleExport() {
    try {
      await exportarMovimientos(filtrosActivos);
      setMensaje("Exportación generada correctamente");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSaved(msg) {
    setMensaje(msg);
    setError("");
    recargarTodo();
  }

  return (
    <div className="kdx-page">
      <div className="kdx-head">
        <div>
          <div className="kdx-title">Kardex / Movimientos</div>
          <div className="kdx-sub">
            Registro completo de entradas, salidas, ajustes y reversión con trazabilidad.
          </div>
        </div>

        <div className="kdx-headActions">
          <button type="button" className="kdx-btn kdx-btn--primary" onClick={() => setOpenEntrada(true)}>
            <i className="fa-solid fa-arrow-down" aria-hidden="true" />
            <span>Nueva entrada</span>
          </button>

          <button type="button" className="kdx-btn" onClick={() => setOpenSalida(true)}>
            <i className="fa-solid fa-arrow-up" aria-hidden="true" />
            <span>Nueva salida</span>
          </button>

          <button type="button" className="kdx-btn" onClick={() => setOpenAjuste(true)}>
            <i className="fa-solid fa-sliders" aria-hidden="true" />
            <span>Nuevo ajuste</span>
          </button>

          <button type="button" className="kdx-btn" onClick={handleExport}>
            <i className="fa-solid fa-file-export" aria-hidden="true" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {mensaje ? <div className="kdx-alert kdx-alert--ok">{mensaje}</div> : null}
      {error ? <div className="kdx-alert kdx-alert--error">{error}</div> : null}

      <section className="kdx-card">
        <div className="kdx-cardHead">
          <div className="kdx-cardTitle">Filtros</div>
        </div>
        <div className="kdx-cardBody">
          <div className="kdx-filters">
            <InsumoPicker
              value={insumoFiltro}
              onChange={(item) => {
                setInsumoFiltro(item);
                setFiltros((f) => ({ ...f, insumo_id: item?.id || "" }));
              }}
            />

            <div className="kdx-field">
              <label>Tipo</label>
              <select
                value={filtros.tipo_movimiento}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, tipo_movimiento: e.target.value }))
                }
              >
                <option value="todos">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="salida">Salidas</option>
                <option value="ajuste">Ajustes</option>
              </select>
            </div>

            <div className="kdx-field">
              <label>Desde</label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, fecha_desde: e.target.value }))
                }
              />
            </div>

            <div className="kdx-field">
              <label>Hasta</label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, fecha_hasta: e.target.value }))
                }
              />
            </div>

            <div className="kdx-field">
              <label>Por página</label>
              <select
                value={filtros.limite}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, limite: Number(e.target.value) }))
                }
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="kdx-actions">
            <button type="button" className="kdx-btn kdx-btn--primary" onClick={handleBuscar}>
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <span>Buscar</span>
            </button>

            <button type="button" className="kdx-btn" onClick={handleLimpiar}>
              <i className="fa-solid fa-eraser" aria-hidden="true" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </section>

      {resumen ? (
        <section className="kdx-card">
          <div className="kdx-cardHead">
            <div className="kdx-cardTitle">Resumen del insumo</div>
          </div>
          <div className="kdx-cardBody">
            <div className="kdx-resumenGrid">
              <div className="kdx-mini">
                <div className="kdx-miniLabel">Insumo</div>
                <div className="kdx-miniValue">{resumen.insumo?.nombre}</div>
              </div>
              <div className="kdx-mini">
                <div className="kdx-miniLabel">Stock actual</div>
                <div className="kdx-miniValue">{resumen.stock_actual}</div>
              </div>
              <div className="kdx-mini">
                <div className="kdx-miniLabel">Stock mínimo</div>
                <div className="kdx-miniValue">{resumen.stock_minimo}</div>
              </div>
              <div className="kdx-mini">
                <div className="kdx-miniLabel">Última entrada</div>
                <div className="kdx-miniValue">{formatearFecha(resumen.ultima_entrada?.fecha_movimiento)}</div>
              </div>
              <div className="kdx-mini">
                <div className="kdx-miniLabel">Última salida</div>
                <div className="kdx-miniValue">{formatearFecha(resumen.ultima_salida?.fecha_movimiento)}</div>
              </div>
              <div className="kdx-mini">
                <div className="kdx-miniLabel">Costo promedio</div>
                <div className="kdx-miniValue">{money(resumen.insumo?.costo_promedio)}</div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="kdx-card">
        <div className="kdx-cardHead">
          <div className="kdx-cardTitle">Historial de movimientos</div>
        </div>
        <div className="kdx-cardBody">
          {loading ? (
            <div className="kdx-empty">Cargando movimientos...</div>
          ) : movimientos.length ? (
            <>
              <div className="kdx-tableWrap">
                <table className="kdx-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Insumo</th>
                      <th>Cantidad</th>
                      <th>Antes</th>
                      <th>Después</th>
                      <th>Costo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((mov) => (
                      <tr key={mov.id}>
                        <td>{formatearFecha(mov.fecha_movimiento)}</td>
                        <td><BadgeTipo tipo={mov.tipo_movimiento} /></td>
                        <td>
                          <div className="kdx-insumoCell">
                            <strong>{mov.insumo?.nombre || "-"}</strong>
                            <span>{mov.subtipo || "-"}</span>
                          </div>
                        </td>
                        <td>{mov.cantidad}</td>
                        <td>{mov.stock_antes}</td>
                        <td>{mov.stock_despues}</td>
                        <td>{mov.costo_total ? money(mov.costo_total) : "-"}</td>
                        <td>
                          {isAdmin ? (
                            <button
                              type="button"
                              className="kdx-iconBtn"
                              title="Eliminar movimiento"
                              onClick={() => {
                                setMovimientoEliminar(mov);
                                setOpenEliminar(true);
                              }}
                            >
                              <i className="fa-solid fa-trash" aria-hidden="true" />
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="kdx-pagination">
                <button
                  type="button"
                  className="kdx-btn"
                  disabled={(pagination.pagina || 1) <= 1}
                  onClick={() => handlePageChange((pagination.pagina || 1) - 1)}
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>

                <span>
                  Página {pagination.pagina || 1} de {pagination.totalPaginas || 1}
                </span>

                <button
                  type="button"
                  className="kdx-btn"
                  disabled={(pagination.pagina || 1) >= (pagination.totalPaginas || 1)}
                  onClick={() => handlePageChange((pagination.pagina || 1) + 1)}
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <div className="kdx-empty">No hay movimientos para los filtros seleccionados.</div>
          )}
        </div>
      </section>

      <EntradaModal open={openEntrada} onClose={() => setOpenEntrada(false)} onSaved={handleSaved} />
      <SalidaModal open={openSalida} onClose={() => setOpenSalida(false)} onSaved={handleSaved} />
      <AjusteModal open={openAjuste} onClose={() => setOpenAjuste(false)} onSaved={handleSaved} />
      <EliminarMovimientoModal
        open={openEliminar}
        movimiento={movimientoEliminar}
        onClose={() => {
          setOpenEliminar(false);
          setMovimientoEliminar(null);
        }}
        onSaved={handleSaved}
        isAdmin={isAdmin}
      />
    </div>
  );
}