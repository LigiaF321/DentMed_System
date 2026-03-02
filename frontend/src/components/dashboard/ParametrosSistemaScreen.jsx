import { useEffect, useMemo, useRef, useState } from "react";
import "./ParametrosSistemaScreen.css";

function parseIntSafe(v) {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  return n;
}

function formatDT(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value || "");
  return d.toLocaleString("es-HN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readJsonSafe(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/** ✅ rol desde userData (agregué más llaves por si tu backend lo manda distinto) */
function getRole(userData) {
  const r =
    userData?.role ??
    userData?.rol ??
    userData?.ROL ??
    userData?.tipo ??
    userData?.tipo_usuario ??
    userData?.tipoUsuario ??
    userData?.perfil ??
    "";
  return String(r).toLowerCase().trim();
}

function getUserLabel(userData) {
  return (
    userData?.email ||
    userData?.username ||
    userData?.usuario ||
    userData?.nombre ||
    "Admin"
  );
}

function getUserId(userData) {
  const v =
    userData?.id ??
    userData?.user_id ??
    userData?.usuario_id ??
    userData?.IDusuarios ??
    null;
  const n = parseIntSafe(v);
  return n ?? null;
}

/** ✅ token (por si tienes middleware JWT) */
function getToken(userData) {
  const t =
    userData?.token ||
    userData?.jwt ||
    userData?.accessToken ||
    userData?.access_token ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token") ||
    "";
  return String(t || "").trim();
}

/** ✅ request con headers x-user-role / x-user-label / x-user-id + Authorization si hay token */
async function requestJSON(url, options, userData) {
  const role = getRole(userData);
  const label = getUserLabel(userData);
  const userId = getUserId(userData);
  const token = getToken(userData);

  const headers = {
    ...(options?.headers || {}),
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
    "x-user-role": role,
    "x-user-label": label,
  };

  if (userId !== null) headers["x-user-id"] = String(userId);
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    ...(options || {}),
    headers,
    credentials: "include", // por si tu backend usa cookies/sesión
  });

  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data?.message || `Solicitud fallida (${res.status})`);
  return data;
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="dmp-modalBackdrop" role="dialog" aria-modal="true">
      <div className="dmp-modal">
        <div className="dmp-modalHead">
          <div className="dmp-modalTitle">{title}</div>
          <button className="dmp-iconBtn" type="button" onClick={onClose} aria-label="Cerrar">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="dmp-modalBody">{children}</div>
      </div>
    </div>
  );
}

export default function ParametrosSistemaScreen({ userData }) {
  const role = getRole(userData);
  const isAdmin = role === "admin" || role === "administrador" || role === "administrator";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [values, setValues] = useState({
    stock_minimo: 5,
    dias_recordatorio: 2,
    intentos_fallidos: 3,
  });
  const [initialValues, setInitialValues] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);

  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState("");
  const [histRows, setHistRows] = useState([]);
  const [histTotal, setHistTotal] = useState(0);

  const [fUsuario, setFUsuario] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const okTimerRef = useRef(null);

  function toastOk(msg) {
    setOkMsg(msg);
    if (okTimerRef.current) clearTimeout(okTimerRef.current);
    okTimerRef.current = setTimeout(() => setOkMsg(""), 2500);
  }

  const dirty = useMemo(() => {
    if (!initialValues) return false;
    return (
      Number(values.stock_minimo) !== Number(initialValues.stock_minimo) ||
      Number(values.dias_recordatorio) !== Number(initialValues.dias_recordatorio) ||
      Number(values.intentos_fallidos) !== Number(initialValues.intentos_fallidos)
    );
  }, [values, initialValues]);

  const diffs = useMemo(() => {
    if (!initialValues) return [];
    const out = [];
    const add = (label, key) => {
      if (Number(values[key]) !== Number(initialValues[key])) {
        out.push({ label, from: initialValues[key], to: values[key] });
      }
    };
    add("Stock mínimo global", "stock_minimo");
    add("Días de recordatorio de citas", "dias_recordatorio");
    add("Límite de intentos fallidos de login", "intentos_fallidos");
    return out;
  }, [values, initialValues]);

  const fieldErrors = useMemo(() => {
    const e = {};

    const s = parseIntSafe(values.stock_minimo);
    if (s === null) e.stock_minimo = "El valor debe ser un número entero";
    else if (s <= 0) e.stock_minimo = "El valor debe ser mayor a 0";
    else if (s < 1 || s > 9999) e.stock_minimo = "Rango: 1 a 9999";

    const d = parseIntSafe(values.dias_recordatorio);
    if (d === null) e.dias_recordatorio = "El valor debe ser un número entero";
    else if (d < 0) e.dias_recordatorio = "Debe ser 0 o mayor";
    else if (d > 30) e.dias_recordatorio = "Rango: 0 a 30";

    const i = parseIntSafe(values.intentos_fallidos);
    if (i === null) e.intentos_fallidos = "El valor debe ser un número entero";
    else if (i <= 0) e.intentos_fallidos = "El valor debe ser mayor a 0";
    else if (i < 1 || i > 10) e.intentos_fallidos = "Rango: 1 a 10";

    return e;
  }, [values]);

  const canSave = useMemo(() => {
    if (!isAdmin) return false;
    if (!dirty) return false;
    return Object.keys(fieldErrors).length === 0;
  }, [isAdmin, dirty, fieldErrors]);

  async function loadParams() {
    try {
      setError("");
      setLoading(true);

      const data = await requestJSON("/api/admin/parametros", null, userData);

      // backend: { parametros: { stock_minimo, dias_recordatorio, intentos_fallidos } }
      const direct = data?.parametros || data;

      const next = {
        stock_minimo: parseIntSafe(direct?.stock_minimo) ?? 5,
        dias_recordatorio: parseIntSafe(direct?.dias_recordatorio) ?? 2,
        intentos_fallidos: parseIntSafe(direct?.intentos_fallidos) ?? 3,
      };

      setValues(next);
      setInitialValues(next);
    } catch (e) {
      setError(e.message || "Error de conexión con el servidor. Intente nuevamente");
    } finally {
      setLoading(false);
    }
  }

  async function loadHist(nextPage = page, nextLimit = limit) {
    // ✅ según tu controller: historial es admin-only (si no, te va a dar 403)
    if (!isAdmin) {
      setHistError("");
      setHistTotal(0);
      setHistRows([]);
      return;
    }

    try {
      setHistError("");
      setHistLoading(true);

      const qs = new URLSearchParams();
      if (fUsuario.trim()) qs.set("usuario", fUsuario.trim());
      if (fDesde) qs.set("desde", fDesde);
      if (fHasta) qs.set("hasta", fHasta);
      qs.set("page", String(nextPage));
      qs.set("limit", String(nextLimit));

      const data = await requestJSON(`/api/admin/parametros/historial?${qs.toString()}`, null, userData);

      const total = Number(data?.total ?? 0) || 0;

      // backend: rows (y también alias datos)
      const rows = Array.isArray(data?.rows)
        ? data.rows
        : Array.isArray(data?.datos)
        ? data.datos
        : [];

      setHistTotal(total);

      // ✅ mapeo con campos reales del controller: usuario_nombre, fecha, cambio, ip
      setHistRows(
        rows.map((r, idx) => ({
          id: r.id ?? `${nextPage}-${idx}`,
          fecha: r.fecha ?? r.createdAt ?? r.created_at ?? "",
          usuario: r.usuario_nombre ?? r.usuario ?? r.user ?? r.email ?? "—",
          cambio: r.cambio ?? r.descripcion ?? r.accion ?? r.detalle ?? "—",
          ip: r.ip ?? r.direccion_ip ?? r.address ?? "—",
        }))
      );
    } catch (e) {
      setHistError(e.message || "No se pudo cargar historial");
      setHistTotal(0);
      setHistRows([]);
    } finally {
      setHistLoading(false);
    }
  }

  useEffect(() => {
    loadParams();

    // ✅ solo admin carga historial para no comerte Forbidden
    if (isAdmin) {
      loadHist(1, limit);
      setPage(1);
    } else {
      setHistRows([]);
      setHistTotal(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    function onBeforeUnload(ev) {
      if (!dirty) return;
      ev.preventDefault();
      ev.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function setField(key, v) {
    setOkMsg("");
    setError("");
    setValues((s) => ({ ...s, [key]: v }));
  }

  async function doSave() {
    if (!isAdmin) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        stock_minimo: parseIntSafe(values.stock_minimo),
        dias_recordatorio: parseIntSafe(values.dias_recordatorio),
        intentos_fallidos: parseIntSafe(values.intentos_fallidos),
      };

      const resp = await requestJSON(
        "/api/admin/parametros",
        { method: "PUT", body: JSON.stringify(payload) },
        userData
      );

      const direct = resp?.parametros || resp?.config || payload;
      const saved = {
        stock_minimo: parseIntSafe(direct?.stock_minimo) ?? payload.stock_minimo,
        dias_recordatorio: parseIntSafe(direct?.dias_recordatorio) ?? payload.dias_recordatorio,
        intentos_fallidos: parseIntSafe(direct?.intentos_fallidos) ?? payload.intentos_fallidos,
      };

      setValues(saved);
      setInitialValues(saved);
      toastOk("Parámetros actualizados exitosamente");

      await loadHist(1, limit);
      setPage(1);
    } catch (e) {
      setError(e.message || "No se pudo guardar. Verifique los datos e intente de nuevo");
    } finally {
      setSaving(false);
    }
  }

  async function doReset() {
    if (!isAdmin) return;

    const ok = window.confirm("¿Restablecer valores por defecto?");
    if (!ok) return;

    try {
      setResetting(true);
      setError("");

      const resp = await requestJSON("/api/admin/parametros/reset", { method: "POST" }, userData);

      const direct = resp?.parametros || resp;
      const next = {
        stock_minimo: parseIntSafe(direct?.stock_minimo) ?? 5,
        dias_recordatorio: parseIntSafe(direct?.dias_recordatorio) ?? 2,
        intentos_fallidos: parseIntSafe(direct?.intentos_fallidos) ?? 3,
      };

      setValues(next);
      setInitialValues(next);
      toastOk("✅ Restablecido a valores por defecto");

      await loadHist(1, limit);
      setPage(1);
    } catch (e) {
      setError(e.message || "No se pudo restablecer");
    } finally {
      setResetting(false);
    }
  }

  function onClickSave() {
    if (!canSave) return;
    setShowConfirm(true);
  }

  function applyFilters() {
    setPage(1);
    loadHist(1, limit);
  }

  const totalPages = useMemo(() => {
    if (!histTotal) return 1;
    return Math.max(1, Math.ceil(histTotal / limit));
  }, [histTotal, limit]);

  function goPage(p) {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    loadHist(next, limit);
  }

  function onExport(fmt) {
    if (!isAdmin) return;

    const qs = new URLSearchParams();
    if (fUsuario.trim()) qs.set("usuario", fUsuario.trim());
    if (fDesde) qs.set("desde", fDesde);
    if (fHasta) qs.set("hasta", fHasta);
    qs.set("format", fmt);

    // tu backend export también es admin-only; aquí mandamos role/user por si lo usas
    qs.set("role", getRole(userData));
    qs.set("user", getUserLabel(userData));

    window.location.href = `/api/admin/parametros/historial/export?${qs.toString()}`;
  }

  return (
    <div className="dmp-page">
      <div className="dmp-head">
        <div className="dmp-headLeft">
          <div className="dmp-title">Configuración de Parámetros del Sistema</div>
          <div className="dmp-sub">
            Los cambios afectan inmediatamente al sistema y quedan registrados en el historial.
          </div>
        </div>

        <div className="dmp-headRight">
          {dirty ? (
            <div className="dmp-dirtyPill" title="Hay cambios pendientes">
              <i className="fa-solid fa-circle-exclamation" />
              Cambios sin guardar
            </div>
          ) : (
            <div className="dmp-dirtyPill dmp-dirtyPill--ok" title="Todo guardado">
              <i className="fa-solid fa-circle-check" />
              Sin cambios
            </div>
          )}

          <button className="dmp-btn dmp-btn--ghost" type="button" onClick={loadParams} disabled={loading}>
            <span className="dmp-icoGrad">
              <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-rotate"}`} />
            </span>
            <span>{loading ? "Actualizando..." : "Actualizar"}</span>
          </button>
        </div>
      </div>

      {!isAdmin ? (
        <div className="dmp-alert dmp-alert--info">
          <i className="fa-solid fa-eye" />
          <div>
            <div className="dmp-alertTitle">Modo solo lectura</div>
            <div className="dmp-alertText">
              Solo el administrador puede ver el historial, exportar y modificar parámetros.
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="dmp-alert dmp-alert--danger">
          <i className="fa-solid fa-triangle-exclamation" />
          <div className="dmp-alertText">{error}</div>
        </div>
      ) : null}

      {okMsg ? (
        <div className="dmp-alert dmp-alert--ok">
          <i className="fa-solid fa-circle-check" />
          <div className="dmp-alertText">{okMsg}</div>
        </div>
      ) : null}

      <div className="dmp-grid">
        <section className="dmp-card">
          <div className="dmp-cardHead">
            <div>
              <div className="dmp-cardTitle">Parámetros generales</div>
              <div className="dmp-cardNote">Validación estricta: números enteros (ver rangos).</div>
            </div>

            <div className="dmp-cardActions">
              {isAdmin ? (
                <>
                  <button
                    className="dmp-btn dmp-btn--primary"
                    type="button"
                    onClick={onClickSave}
                    disabled={!canSave || saving}
                    title={!canSave ? "Verifica datos o no hay cambios" : "Guardar cambios"}
                  >
                    <span className="dmp-icoGrad dmp-icoGrad--primary">
                      <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} />
                    </span>
                    <span>{saving ? "Guardando..." : "Guardar cambios"}</span>
                  </button>

                  <button
                    className="dmp-btn dmp-btn--ghost"
                    type="button"
                    onClick={doReset}
                    disabled={resetting}
                    title="Restablecer valores por defecto"
                  >
                    <span className="dmp-icoGrad">
                      <i className={`fa-solid ${resetting ? "fa-spinner fa-spin" : "fa-rotate-left"}`} />
                    </span>
                    <span>{resetting ? "Restableciendo..." : "Restablecer"}</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="dmp-cardBody">
            <div className="dmp-formGrid">
              <div className="dmp-field">
                <label>Stock mínimo global</label>
                <div className="dmp-inputWrap">
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    step={1}
                    value={values.stock_minimo}
                    onChange={(e) => setField("stock_minimo", e.target.value)}
                    disabled={!isAdmin}
                    inputMode="numeric"
                  />
                  <span className="dmp-help">Cuando el inventario baje de esta cantidad, se generará alerta.</span>
                </div>
                {fieldErrors.stock_minimo ? <div className="dmp-fieldErr">{fieldErrors.stock_minimo}</div> : null}
              </div>

              <div className="dmp-field">
                <label>Días de recordatorio de citas</label>
                <div className="dmp-inputWrap">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={1}
                    value={values.dias_recordatorio}
                    onChange={(e) => setField("dias_recordatorio", e.target.value)}
                    disabled={!isAdmin}
                    inputMode="numeric"
                  />
                  <span className="dmp-help">El sistema enviará recordatorio esta cantidad de días antes (0 permitido).</span>
                </div>
                {fieldErrors.dias_recordatorio ? (
                  <div className="dmp-fieldErr">{fieldErrors.dias_recordatorio}</div>
                ) : null}
              </div>

              <div className="dmp-field">
                <label>Límite de intentos fallidos de login</label>
                <div className="dmp-inputWrap">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={values.intentos_fallidos}
                    onChange={(e) => setField("intentos_fallidos", e.target.value)}
                    disabled={!isAdmin}
                    inputMode="numeric"
                  />
                  <span className="dmp-help">Después de esta cantidad, la cuenta se bloqueará temporalmente.</span>
                </div>
                {fieldErrors.intentos_fallidos ? (
                  <div className="dmp-fieldErr">{fieldErrors.intentos_fallidos}</div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="dmp-card">
          <div className="dmp-cardHead">
            <div>
              <div className="dmp-cardTitle">Historial de cambios</div>
              <div className="dmp-cardNote">Filtros + paginación. Exportación respeta filtros.</div>
            </div>

            <div className="dmp-cardActions">
              {isAdmin ? (
                <>
                  <button className="dmp-btn dmp-btn--ghost" type="button" onClick={() => onExport("pdf")} title="Exportar PDF">
                    <span className="dmp-icoGrad">
                      <i className="fa-solid fa-file-pdf" />
                    </span>
                    <span>PDF</span>
                  </button>
                  <button className="dmp-btn dmp-btn--ghost" type="button" onClick={() => onExport("excel")} title="Exportar Excel">
                    <span className="dmp-icoGrad">
                      <i className="fa-solid fa-file-excel" />
                    </span>
                    <span>Excel</span>
                  </button>
                  <button className="dmp-btn dmp-btn--ghost" type="button" onClick={() => onExport("csv")} title="Exportar CSV">
                    <span className="dmp-icoGrad">
                      <i className="fa-solid fa-file-csv" />
                    </span>
                    <span>CSV</span>
                  </button>

                  <button className="dmp-btn dmp-btn--ghost" type="button" onClick={() => loadHist(page, limit)} disabled={histLoading}>
                    <span className="dmp-icoGrad">
                      <i className={`fa-solid ${histLoading ? "fa-spinner fa-spin" : "fa-rotate"}`} />
                    </span>
                    <span>Actualizar</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="dmp-cardBody">
            {!isAdmin ? (
              <div className="dmp-empty">Historial disponible solo para administrador.</div>
            ) : (
              <>
                {histError ? <div className="dmp-miniErr">{histError}</div> : null}

                <div className="dmp-filters">
                  <div className="dmp-f">
                    <label>Usuario</label>
                    <input value={fUsuario} onChange={(e) => setFUsuario(e.target.value)} placeholder="Buscar (parcial)..." />
                  </div>

                  <div className="dmp-f">
                    <label>Desde</label>
                    <input type="date" value={fDesde} onChange={(e) => setFDesde(e.target.value)} />
                  </div>

                  <div className="dmp-f">
                    <label>Hasta</label>
                    <input type="date" value={fHasta} onChange={(e) => setFHasta(e.target.value)} />
                  </div>

                  <div className="dmp-f dmp-f--small">
                    <label>Límite</label>
                    <select
                      value={String(limit)}
                      onChange={(e) => {
                        const next = Number(e.target.value) || 5;
                        setLimit(next);
                        setPage(1);
                        loadHist(1, next);
                      }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                    </select>
                  </div>

                  <div className="dmp-f dmp-f--actions">
                    <button className="dmp-btn dmp-btn--primary" type="button" onClick={applyFilters} disabled={histLoading}>
                      <span className="dmp-icoGrad dmp-icoGrad--primary">
                        <i className="fa-solid fa-filter" />
                      </span>
                      <span>Aplicar</span>
                    </button>

                    <button
                      className="dmp-btn dmp-btn--ghost"
                      type="button"
                      onClick={() => {
                        setFUsuario("");
                        setFDesde("");
                        setFHasta("");
                        setPage(1);
                        loadHist(1, limit);
                      }}
                      disabled={histLoading}
                    >
                      <span className="dmp-icoGrad">
                        <i className="fa-solid fa-broom" />
                      </span>
                      <span>Limpiar</span>
                    </button>
                  </div>
                </div>

                <div className="dmp-table">
                  <div className="dmp-thead">
                    <div>Fecha y hora</div>
                    <div>Usuario</div>
                    <div>Cambio realizado</div>
                    <div className="dmp-right">IP</div>
                  </div>

                  {histLoading ? (
                    <div className="dmp-empty">Cargando historial…</div>
                  ) : histRows.length === 0 ? (
                    <div className="dmp-empty">No hay registros</div>
                  ) : (
                    histRows.map((r) => (
                      <div key={r.id} className="dmp-trow">
                        <div className="dmp-mono">{formatDT(r.fecha)}</div>
                        <div className="dmp-strong">{r.usuario}</div>
                        <div className="dmp-wrap">{r.cambio}</div>
                        <div className="dmp-right dmp-mono">{r.ip}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="dmp-pagi">
                  <div className="dmp-pagiLeft">
                    Mostrando {histTotal === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, histTotal)} de {histTotal} registros
                  </div>

                  <div className="dmp-pagiRight">
                    <button className="dmp-pageBtn" type="button" onClick={() => goPage(page - 1)} disabled={page <= 1 || histLoading}>
                      <i className="fa-solid fa-chevron-left" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                      const p = start + i;
                      if (p > totalPages) return null;
                      return (
                        <button
                          key={p}
                          className={`dmp-pageBtn ${p === page ? "dmp-pageBtn--active" : ""}`}
                          type="button"
                          onClick={() => goPage(p)}
                          disabled={histLoading}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button className="dmp-pageBtn" type="button" onClick={() => goPage(page + 1)} disabled={page >= totalPages || histLoading}>
                      <i className="fa-solid fa-chevron-right" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <Modal open={showConfirm} title="Confirmar actualización de parámetros" onClose={() => setShowConfirm(false)}>
        {diffs.length === 0 ? (
          <div className="dmp-empty" style={{ padding: 0 }}>
            No hay cambios para guardar.
          </div>
        ) : (
          <>
            <div className="dmp-confirmText">Resumen de cambios:</div>
            <div className="dmp-diffList">
              {diffs.map((d) => (
                <div key={d.label} className="dmp-diffRow">
                  <div className="dmp-diffLabel">{d.label}</div>
                  <div className="dmp-diffVals">
                    <span className="dmp-diffFrom">{d.from}</span>
                    <i className="fa-solid fa-arrow-right-long" />
                    <span className="dmp-diffTo">{d.to}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="dmp-modalActions">
              <button className="dmp-btn dmp-btn--ghost" type="button" onClick={() => setShowConfirm(false)} disabled={saving}>
                Cancelar
              </button>
              <button
                className="dmp-btn dmp-btn--primary"
                type="button"
                onClick={async () => {
                  setShowConfirm(false);
                  await doSave();
                }}
                disabled={saving}
              >
                <span className="dmp-icoGrad dmp-icoGrad--primary">
                  <i className="fa-solid fa-check" />
                </span>
                Confirmar
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}