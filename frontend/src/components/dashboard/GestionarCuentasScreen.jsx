import React, { useEffect, useState } from "react";
import "./GestionarCuentasScreen.css";

const API_BASE = "/api/admin/dentistas";

export default function GestionarCuentasScreen() {
  const [dentistas, setDentistas] = useState([]);
  const [paginacion, setPaginacion] = useState({ total: 0, pagina: 1, por_pagina: 10, total_paginas: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({ nombre: "", email: "", estado: "" });
  const [modalEdit, setModalEdit] = useState(null);
  const [modalToggle, setModalToggle] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [saving, setSaving] = useState(false);
  const [dependencias, setDependencias] = useState(null);

  const cargarDentistas = (page = 1, limit = 10, filtrosOverride = null) => {
    setLoading(true);
    const f = filtrosOverride ?? filtros;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(f.nombre && { nombre: f.nombre }),
      ...(f.email && { email: f.email }),
      ...(f.estado && { estado: f.estado }),
    });
    fetch(`${API_BASE}?${params}`)
      .then(async (res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`El servidor devolvió ${res.status}. Verifica que el backend esté corriendo (puerto 3000).`);
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        return data;
      })
      .then((data) => {
        setDentistas(data.data || []);
        setPaginacion(data.paginacion || { total: 0, pagina: 1, por_pagina: 10, total_paginas: 0 });
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Error al cargar dentistas");
        setDentistas([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarDentistas(paginacion.pagina, paginacion.por_pagina);
  }, [paginacion.pagina, paginacion.por_pagina]);

  const handleBuscar = () => {
    setPaginacion((p) => ({ ...p, pagina: 1 }));
    cargarDentistas(1, paginacion.por_pagina, filtros);
  };

  const handleLimpiarFiltros = () => {
    const filtrosVacios = { nombre: "", email: "", estado: "" };
    setFiltros(filtrosVacios);
    setPaginacion((p) => ({ ...p, pagina: 1 }));
    cargarDentistas(1, paginacion.por_pagina, filtrosVacios);
  };

  const abrirEditar = (d) => {
    setModalEdit(d);
    setFormEdit({
      nombres: d.nombres || d.nombre_completo || "",
      apellidos: d.apellidos || "",
      email: d.email || "",
      telefono: d.telefono || "",
      especialidad: d.especialidad || "",
      licencia: d.licencia || "",
    });
  };

  const guardarEditar = async () => {
    if (!modalEdit) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/${modalEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formEdit),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar");
      }
      setModalEdit(null);
      cargarDentistas(paginacion.pagina, paginacion.por_pagina);
    } catch (err) {
      alert(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const abrirToggle = (d) => {
    setModalToggle(d);
  };

  const confirmarToggle = async () => {
    if (!modalToggle) return;
    setSaving(true);
    try {
      const nuevoEstado = !modalToggle.activo;
      const res = await fetch(`${API_BASE}/${modalToggle.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nuevoEstado }),
      });
      if (!res.ok) throw new Error("Error al cambiar estado");
      setModalToggle(null);
      cargarDentistas(paginacion.pagina, paginacion.por_pagina);
    } catch (err) {
      alert(err.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const abrirEliminar = async (d) => {
    setModalDelete(d);
    setDependencias(null);
    try {
      const res = await fetch(`${API_BASE}/${d.id}/dependencias`);
      const data = await res.json();
      setDependencias(data);
    } catch {
      setDependencias({ puede_eliminar: true, mensaje: "" });
    }
  };

  const confirmarEliminar = async () => {
    if (!modalDelete || (dependencias && !dependencias.puede_eliminar)) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/${modalDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.mensaje || err.error || "Error al eliminar");
      }
      setModalDelete(null);
      setDependencias(null);
      cargarDentistas(paginacion.pagina, paginacion.por_pagina);
    } catch (err) {
      alert(err.message || "Error al eliminar");
    } finally {
      setSaving(false);
    }
  };

  const nombreCompleto = (d) =>
    d.nombre_completo || `${d.nombres || ""} ${d.apellidos || ""}`.trim() || "-";

  if (loading && dentistas.length === 0) {
    return (
      <div className="dm-gc-loading">
        <i className="fa-solid fa-spinner fa-spin me-2" />
        Cargando listado...
      </div>
    );
  }

  if (error && dentistas.length === 0) {
    return (
      <div className="dm-gc-error">
        <i className="fa-solid fa-triangle-exclamation me-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="dm-gc">
      <div className="dm-gc-header">
        <h2 className="dm-gc-title">
          <i className="fa-solid fa-users me-2" />
          Gestionar Cuentas
        </h2>
        <p className="dm-gc-subtitle">Listado de dentistas registrados</p>
      </div>

      {/* Filtros */}
      <div className="dm-gc-filtros">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={filtros.nombre}
          onChange={(e) => setFiltros((f) => ({ ...f, nombre: e.target.value }))}
          className="dm-gc-input"
        />
        <input
          type="text"
          placeholder="Buscar por email..."
          value={filtros.email}
          onChange={(e) => setFiltros((f) => ({ ...f, email: e.target.value }))}
          className="dm-gc-input"
        />
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
          className="dm-gc-select"
        >
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <button type="button" className="dm-gc-btn-buscar" onClick={handleBuscar}>
          <i className="fa-solid fa-search me-2" />
          Buscar
        </button>
        <button type="button" className="dm-gc-btn-limpiar" onClick={handleLimpiarFiltros}>
          Limpiar filtros
        </button>
      </div>

      {/* Tabla */}
      <div className="dm-gc-table-wrap">
        {loading && (
          <div className="dm-gc-overlay">
            <i className="fa-solid fa-spinner fa-spin" />
          </div>
        )}
        <table className="dm-gc-table">
          <thead>
            <tr>
              <th>Nombre completo</th>
              <th>Email</th>
              <th>Especialidad</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dentistas.length === 0 ? (
              <tr>
                <td colSpan={6} className="dm-gc-empty">
                  No hay dentistas registrados
                </td>
              </tr>
            ) : (
              dentistas.map((d) => (
                <tr key={d.id} className={!d.activo ? "dm-gc-row-inactive" : ""}>
                  <td>{nombreCompleto(d)}</td>
                  <td>{d.email || "-"}</td>
                  <td>{d.especialidad || "-"}</td>
                  <td>{d.telefono || "-"}</td>
                  <td>
                    <span className={`dm-gc-status dm-gc-status-${d.activo ? "activo" : "inactivo"}`}>
                      <span className="dm-gc-status-dot" />
                      {d.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="dm-gc-btn dm-gc-btn-edit" title="Editar" onClick={() => abrirEditar(d)}>
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button type="button" className="dm-gc-btn dm-gc-btn-toggle" title={d.activo ? "Inhabilitar" : "Habilitar"} onClick={() => abrirToggle(d)}>
                      <i className={`fa-solid ${d.activo ? "fa-lock" : "fa-check"}`} />
                    </button>
                    <button type="button" className="dm-gc-btn dm-gc-btn-delete" title="Eliminar" onClick={() => abrirEliminar(d)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {paginacion.total_paginas > 1 && (
        <div className="dm-gc-pagination">
          <button
            type="button"
            disabled={paginacion.pagina <= 1}
            onClick={() => setPaginacion((p) => ({ ...p, pagina: p.pagina - 1 }))}
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
          <span>
            Página {paginacion.pagina} de {paginacion.total_paginas} ({paginacion.total} registros)
          </span>
          <button
            type="button"
            disabled={paginacion.pagina >= paginacion.total_paginas}
            onClick={() => setPaginacion((p) => ({ ...p, pagina: p.pagina + 1 }))}
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      )}

      {/* Modal Editar */}
      {modalEdit && (
        <div className="dm-modal-backdrop" onClick={() => !saving && setModalEdit(null)}>
          <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dm-modal-title">
              <i className="fa-solid fa-pen me-2" />
              Editar cuenta de dentista
            </h3>
            <div className="dm-modal-body">
              <div className="dm-gc-form-group">
                <label>Nombres *</label>
                <input
                  type="text"
                  value={formEdit.nombres}
                  onChange={(e) => setFormEdit((f) => ({ ...f, nombres: e.target.value }))}
                  placeholder="Ej: Juan Carlos"
                />
              </div>
              <div className="dm-gc-form-group">
                <label>Apellidos *</label>
                <input
                  type="text"
                  value={formEdit.apellidos}
                  onChange={(e) => setFormEdit((f) => ({ ...f, apellidos: e.target.value }))}
                  placeholder="Ej: Pérez García"
                />
              </div>
              <div className="dm-gc-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formEdit.email}
                  onChange={(e) => setFormEdit((f) => ({ ...f, email: e.target.value }))}
                  placeholder="correo@clinica.com"
                />
              </div>
              <div className="dm-gc-form-group">
                <label>Teléfono *</label>
                <input
                  type="text"
                  value={formEdit.telefono}
                  onChange={(e) => setFormEdit((f) => ({ ...f, telefono: e.target.value }))}
                  placeholder="9999-9999"
                />
              </div>
              <div className="dm-gc-form-group">
                <label>Especialidad *</label>
                <input
                  type="text"
                  value={formEdit.especialidad}
                  onChange={(e) => setFormEdit((f) => ({ ...f, especialidad: e.target.value }))}
                  placeholder="Ortodoncia"
                />
              </div>
              <div className="dm-gc-form-group">
                <label>Número de licencia</label>
                <input
                  type="text"
                  value={formEdit.licencia}
                  onChange={(e) => setFormEdit((f) => ({ ...f, licencia: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="dm-modal-footer">
              <button type="button" className="dm-btn-cancel" onClick={() => !saving && setModalEdit(null)}>
                Cancelar
              </button>
              <button type="button" className="dm-btn-save" onClick={guardarEditar} disabled={saving}>
                {saving ? <i className="fa-solid fa-spinner fa-spin me-2" /> : null}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inhabilitar/Habilitar */}
      {modalToggle && (
        <div className="dm-modal-backdrop" onClick={() => !saving && setModalToggle(null)}>
          <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dm-modal-title">
              <i className={`fa-solid ${modalToggle.activo ? "fa-lock" : "fa-check"} me-2`} />
              {modalToggle.activo ? "Inhabilitar cuenta" : "Habilitar cuenta"}
            </h3>
            <div className="dm-modal-body">
              <p>
                {modalToggle.activo
                  ? `¿Está seguro que desea inhabilitar la cuenta de Dr. ${nombreCompleto(modalToggle)}? El dentista no podrá acceder al sistema hasta que sea habilitado nuevamente.`
                  : `¿Está seguro que desea habilitar la cuenta de Dr. ${nombreCompleto(modalToggle)}? El dentista podrá acceder nuevamente al sistema.`}
              </p>
            </div>
            <div className="dm-modal-footer">
              <button type="button" className="dm-btn-cancel" onClick={() => !saving && setModalToggle(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className={modalToggle.activo ? "dm-btn-danger" : "dm-btn-success"}
                onClick={confirmarToggle}
                disabled={saving}
              >
                {saving ? <i className="fa-solid fa-spinner fa-spin me-2" /> : null}
                {modalToggle.activo ? "Sí, inhabilitar" : "Sí, habilitar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {modalDelete && (
        <div className="dm-modal-backdrop" onClick={() => !saving && setModalDelete(null)}>
          <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dm-modal-title dm-modal-title-danger">
              <i className="fa-solid fa-triangle-exclamation me-2" />
              Eliminar cuenta permanentemente
            </h3>
            <div className="dm-modal-body">
              <p>
                ¿Está seguro que desea eliminar permanentemente la cuenta de Dr. {nombreCompleto(modalDelete)}? Esta acción no se puede deshacer.
              </p>
              <p className="dm-modal-warning">Se eliminarán todos los datos asociados a este dentista (citas, historial, etc.)</p>
              {dependencias === null && (
                <div className="dm-modal-loading">
                  <i className="fa-solid fa-spinner fa-spin me-2" />
                  Verificando dependencias...
                </div>
              )}
              {dependencias && !dependencias.puede_eliminar && (
                <div className="dm-modal-error">
                  <i className="fa-solid fa-ban me-2" />
                  {dependencias.mensaje || "No se puede eliminar: tiene citas futuras programadas."}
                </div>
              )}
            </div>
            <div className="dm-modal-footer">
              <button type="button" className="dm-btn-cancel" onClick={() => setModalDelete(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="dm-btn-danger"
                onClick={confirmarEliminar}
                disabled={saving || dependencias === null || (dependencias && !dependencias.puede_eliminar)}
              >
                {saving ? <i className="fa-solid fa-spinner fa-spin me-2" /> : null}
                Eliminar permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
