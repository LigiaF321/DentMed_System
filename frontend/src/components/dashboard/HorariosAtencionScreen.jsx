import { useEffect, useMemo, useState } from "react";
import "./HorariosAtencionScreen.css";

const DIAS_ORDEN = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function stripDiacritics(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normTipo(v) {
  return stripDiacritics(String(v || "").toLowerCase());
}

function normDia(v) {
  return stripDiacritics(String(v || "").toLowerCase());
}

function fmtDateISO(d) {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function Badge({ type }) {
  const t = normTipo(type);
  const isWeekly = t === "semanal";
  const cls = isWeekly ? "dmh-badge dmh-badge-info" : "dmh-badge dmh-badge-warn";
  return <span className={cls}>{isWeekly ? "SEMANAL" : "EXCEPCIÓN"}</span>;
}

async function readJsonSafe(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

async function requestJSON(url, options) {
  const res = await fetch(url, options);
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data?.message || "Solicitud fallida");
  return data;
}

export default function HorariosAtencionScreen({ userData }) {
  const canEdit = userData?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingTipo, setEditingTipo] = useState(null);

  const [formWeekly, setFormWeekly] = useState({
    dia_semana: "Lunes",
    hora_inicio: "08:00:00",
    hora_fin: "12:00:00",
    activo: true,
    descripcion: "Horario regular",
  });

  const [formEx, setFormEx] = useState({
    fecha: fmtDateISO(new Date()),
    hora_inicio: "08:00:00",
    hora_fin: "12:00:00",
    activo: true,
    descripcion: "Feriado / horario especial",
  });

  const weekly = useMemo(() => {
    const semanal = rows.filter((r) => normTipo(r.tipo) === "semanal");
    const base = new Map(DIAS_ORDEN.map((d) => [normDia(d), null]));

    for (const r of semanal) {
      const k = normDia(r.dia_semana);
      if (base.has(k) && !base.get(k)) base.set(k, r);
    }

    return DIAS_ORDEN.map((d) => ({ dia: d, row: base.get(normDia(d)) }));
  }, [rows]);

  const exceptions = useMemo(() => {
    return rows
      .filter((r) => normTipo(r.tipo) === "excepcion")
      .map((r) => ({ ...r, fecha: fmtDateISO(r.fecha) }))
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  }, [rows]);

  async function load() {
    try {
      setError("");
      setLoading(true);
      const data = await requestJSON("/api/admin/horarios");

      const semanal = Array.isArray(data?.semanal) ? data.semanal : [];
      const excepciones = Array.isArray(data?.excepciones) ? data.excepciones : [];

      setRows([...semanal, ...excepciones]);
    } catch (e) {
      setError(e.message || "Error cargando horarios");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (canEdit) return;
    setEditingId(null);
    setEditingTipo(null);
  }, [canEdit]);

  async function upsertSemanal(payload) {
    if (!canEdit) throw new Error("Sin permisos para modificar.");
    return requestJSON("/api/admin/horarios/semanal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function createExcepcion(payload) {
    if (!canEdit) throw new Error("Sin permisos para modificar.");
    return requestJSON("/api/admin/horarios/excepcion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function updateExcepcion(id, payload) {
    if (!canEdit) throw new Error("Sin permisos para modificar.");
    const first = await fetch(`/api/admin/horarios/excepcion/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (first.status !== 404) {
      const data = await readJsonSafe(first);
      if (!first.ok) throw new Error(data?.message || "No se pudo actualizar");
      return data;
    }

    return requestJSON(`/api/admin/horarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function deleteExcepcion(id) {
    if (!canEdit) throw new Error("Sin permisos para modificar.");
    const first = await fetch(`/api/admin/horarios/excepcion/${id}`, { method: "DELETE" });

    if (first.status !== 404) {
      const data = await readJsonSafe(first);
      if (!first.ok) throw new Error(data?.message || "No se pudo eliminar");
      return data;
    }

    return requestJSON(`/api/admin/horarios/${id}`, { method: "DELETE" });
  }

  async function onSaveWeekly(e) {
    e.preventDefault();
    if (!canEdit) return;

    try {
      setError("");
      const payload = {
        tipo: "SEMANAL",
        dia_semana: formWeekly.dia_semana,
        fecha: null,
        hora_inicio: formWeekly.hora_inicio,
        hora_fin: formWeekly.hora_fin,
        activo: !!formWeekly.activo,
        descripcion: formWeekly.descripcion || null,
      };

      await upsertSemanal(payload);

      setEditingId(null);
      setEditingTipo(null);
      await load();
    } catch (e2) {
      setError(e2.message || "Error guardando");
    }
  }

  async function onAddException(e) {
    e.preventDefault();
    if (!canEdit) return;

    try {
      setError("");
      const payload = {
        tipo: "EXCEPCION",
        fecha: formEx.fecha,
        hora_inicio: formEx.hora_inicio,
        hora_fin: formEx.hora_fin,
        activo: formEx.activo ? 1 : 0,
        descripcion: formEx.descripcion,
        dia_semana: null,
      };

      if (editingTipo === "excepcion" && editingId) {
        await updateExcepcion(editingId, payload);
      } else {
        await createExcepcion(payload);
      }

      setEditingId(null);
      setEditingTipo(null);
      setFormEx((s) => ({ ...s, fecha: fmtDateISO(new Date()) }));
      await load();
    } catch (e2) {
      setError(e2.message || "Error guardando excepción");
    }
  }

  function startEdit(row) {
    if (!canEdit) return;

    setEditingId(row.id);
    const t = normTipo(row.tipo);
    setEditingTipo(t);

    if (t === "semanal") {
      setFormWeekly({
        dia_semana: row.dia_semana || "Lunes",
        hora_inicio: row.hora_inicio || "08:00:00",
        hora_fin: row.hora_fin || "12:00:00",
        activo: row.activo ?? true,
        descripcion: row.descripcion || "Horario regular",
      });
    } else {
      setFormEx({
        fecha: fmtDateISO(row.fecha),
        hora_inicio: row.hora_inicio || "08:00:00",
        hora_fin: row.hora_fin || "12:00:00",
        activo: row.activo ?? true,
        descripcion: row.descripcion || "Feriado / horario especial",
      });
    }
  }

  async function onToggleActive(row) {
    if (!canEdit) return;

    try {
      setError("");
      const t = normTipo(row.tipo);

      if (t === "semanal") {
        await upsertSemanal({
          tipo: "SEMANAL",
          dia_semana: row.dia_semana,
          fecha: null,
          hora_inicio: row.hora_inicio,
          hora_fin: row.hora_fin,
          activo: !row.activo,
          descripcion: row.descripcion || null,
        });
      } else {
        await updateExcepcion(row.id, { activo: !row.activo });
      }

      await load();
    } catch (e) {
      setError(e.message || "Error actualizando estado");
    }
  }

  async function onDelete(row) {
    if (!canEdit) return;

    const ok = window.confirm("¿Eliminar este registro?");
    if (!ok) return;

    try {
      setError("");
      const t = normTipo(row.tipo);

      if (t === "semanal") {
        await upsertSemanal({
          tipo: "SEMANAL",
          dia_semana: row.dia_semana,
          fecha: null,
          hora_inicio: row.hora_inicio,
          hora_fin: row.hora_fin,
          activo: false,
          descripcion: row.descripcion || null,
        });
      } else {
        await deleteExcepcion(row.id);
      }

      await load();
    } catch (e) {
      setError(e.message || "Error eliminando");
    }
  }

  return (
    <div className="dmh-page">
      <div className="dmh-header">
        <div>
          <div className="dmh-title">Horarios de Atención de la Clínica</div>
          <div className="dmh-sub">
            Configura el horario semanal y registra feriados / excepciones por fecha.
            {!canEdit ? " (Solo lectura)" : ""}
          </div>
        </div>
        <button className="dmh-btn" type="button" onClick={load} disabled={loading}>
          <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-rotate"}`} />
          <span>{loading ? "Actualizando..." : "Actualizar"}</span>
        </button>
      </div>

      {error ? <div className="dmh-alert">{error}</div> : null}

      <div className="dmh-grid">
        <section className="dmh-card">
          <div className="dmh-card-head">
            <div className="dmh-card-title">Horarios regulares por día</div>
            <div className="dmh-card-note">Se guarda 1 horario por día (editable).</div>
          </div>

          <div className="dmh-table">
            <div className="dmh-thead">
              <div>Día</div>
              <div className="dmh-center">Inicio</div>
              <div className="dmh-center">Fin</div>
              <div className="dmh-center">Activo</div>
              <div className="dmh-right">Acciones</div>
            </div>

            {weekly.map(({ dia, row }) => (
              <div key={dia} className="dmh-trow">
                <div className="dmh-strong">{dia}</div>
                <div className="dmh-center">{row?.hora_inicio || "—"}</div>
                <div className="dmh-center">{row?.hora_fin || "—"}</div>
                <div className="dmh-center">
                  {row ? (
                    canEdit ? (
                      <button
                        className={`dmh-pill ${row.activo ? "dmh-pill-ok" : "dmh-pill-off"}`}
                        type="button"
                        onClick={() => onToggleActive(row)}
                        title="Cambiar estado"
                      >
                        {row.activo ? "Sí" : "No"}
                      </button>
                    ) : (
                      <span className={`dmh-pill ${row.activo ? "dmh-pill-ok" : "dmh-pill-off"}`}>
                        {row.activo ? "Sí" : "No"}
                      </span>
                    )
                  ) : (
                    "—"
                  )}
                </div>

                <div className="dmh-right">
                  {row ? (
                    canEdit ? (
                      <>
                        <button className="dmh-iconbtn" type="button" onClick={() => startEdit(row)} title="Editar">
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button
                          className="dmh-iconbtn dmh-iconbtn-danger"
                          type="button"
                          onClick={() => onDelete(row)}
                          title="Desactivar"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </>
                    ) : (
                      <span className="dmh-muted">—</span>
                    )
                  ) : (
                    <span className="dmh-muted">Sin horario</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {canEdit ? (
            <form className="dmh-form" onSubmit={onSaveWeekly}>
              <div className="dmh-form-title">
                <span>{editingTipo === "semanal" ? "Editar horario semanal" : "Guardar horario semanal"}</span>
                <span className="dmh-muted">({formWeekly.dia_semana})</span>
              </div>

              <div className="dmh-form-grid">
                <div className="dmh-field">
                  <label>Día</label>
                  <select
                    value={formWeekly.dia_semana}
                    onChange={(e) => setFormWeekly((s) => ({ ...s, dia_semana: e.target.value }))}
                  >
                    {DIAS_ORDEN.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dmh-field">
                  <label>Hora inicio</label>
                  <input
                    type="time"
                    value={String(formWeekly.hora_inicio || "").slice(0, 5)}
                    onChange={(e) => setFormWeekly((s) => ({ ...s, hora_inicio: `${e.target.value}:00` }))}
                    required
                  />
                </div>

                <div className="dmh-field">
                  <label>Hora fin</label>
                  <input
                    type="time"
                    value={String(formWeekly.hora_fin || "").slice(0, 5)}
                    onChange={(e) => setFormWeekly((s) => ({ ...s, hora_fin: `${e.target.value}:00` }))}
                    required
                  />
                </div>

                <div className="dmh-field">
                  <label>Activo</label>
                  <select
                    value={formWeekly.activo ? "1" : "0"}
                    onChange={(e) => setFormWeekly((s) => ({ ...s, activo: e.target.value === "1" }))}
                  >
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </div>

                <div className="dmh-field dmh-span-2">
                  <label>Descripción</label>
                  <input
                    value={formWeekly.descripcion || ""}
                    onChange={(e) => setFormWeekly((s) => ({ ...s, descripcion: e.target.value }))}
                    placeholder="Ej: Horario regular"
                  />
                </div>
              </div>

              <div className="dmh-form-actions">
                <button className="dmh-btn" type="submit">
                  <i className="fa-solid fa-floppy-disk" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <section className="dmh-card">
          <div className="dmh-card-head">
            <div className="dmh-card-title">Calendario de feriados y excepciones</div>
            <div className="dmh-card-note">Para cierres o horarios especiales por fecha.</div>
          </div>

          {canEdit ? (
            <form className="dmh-form" onSubmit={onAddException}>
              <div className="dmh-form-title">{editingTipo === "excepcion" ? "Editar excepción" : "Agregar excepción"}</div>

              <div className="dmh-form-grid">
                <div className="dmh-field">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={formEx.fecha}
                    onChange={(e) => setFormEx((s) => ({ ...s, fecha: e.target.value }))}
                    required
                  />
                </div>

                <div className="dmh-field">
                  <label>Hora inicio</label>
                  <input
                    type="time"
                    value={String(formEx.hora_inicio || "").slice(0, 5)}
                    onChange={(e) => setFormEx((s) => ({ ...s, hora_inicio: `${e.target.value}:00` }))}
                    required
                  />
                </div>

                <div className="dmh-field">
                  <label>Hora fin</label>
                  <input
                    type="time"
                    value={String(formEx.hora_fin || "").slice(0, 5)}
                    onChange={(e) => setFormEx((s) => ({ ...s, hora_fin: `${e.target.value}:00` }))}
                    required
                  />
                </div>

                <div className="dmh-field">
                  <label>Activo</label>
                  <select
                    value={formEx.activo ? "1" : "0"}
                    onChange={(e) => setFormEx((s) => ({ ...s, activo: e.target.value === "1" }))}
                  >
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </div>

                <div className="dmh-field dmh-span-2">
                  <label>Descripción</label>
                  <input
                    value={formEx.descripcion || ""}
                    onChange={(e) => setFormEx((s) => ({ ...s, descripcion: e.target.value }))}
                    placeholder="Ej: Feriado nacional / cierre"
                  />
                </div>
              </div>

              <div className="dmh-form-actions">
                <button className="dmh-btn" type="submit">
                  <i className={`fa-solid ${editingTipo === "excepcion" ? "fa-floppy-disk" : "fa-plus"}`} />
                  <span>{editingTipo === "excepcion" ? "Guardar cambios" : "Guardar excepción"}</span>
                </button>
              </div>
            </form>
          ) : null}

          <div className="dmh-list">
            {exceptions.length === 0 ? (
              <div className="dmh-empty">No hay excepciones registradas</div>
            ) : (
              exceptions.map((r) => (
                <div key={r.id} className="dmh-item">
                  <div className="dmh-item-left">
                    <Badge type={r.tipo} />
                    <div>
                      <div className="dmh-item-title">{r.fecha}</div>
                      <div className="dmh-item-sub">
                        {r.hora_inicio} - {r.hora_fin} ·{" "}
                        <span className={r.activo ? "dmh-ok" : "dmh-off"}>{r.activo ? "Activo" : "Inactivo"}</span>
                      </div>
                      {r.descripcion ? <div className="dmh-item-desc">{r.descripcion}</div> : null}
                    </div>
                  </div>

                  <div className="dmh-item-actions">
                    {canEdit ? (
                      <>
                        <button className="dmh-iconbtn" type="button" onClick={() => startEdit(r)} title="Editar">
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button
                          className="dmh-iconbtn dmh-iconbtn-danger"
                          type="button"
                          onClick={() => onDelete(r)}
                          title="Eliminar"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </>
                    ) : (
                      <span className="dmh-muted">—</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}