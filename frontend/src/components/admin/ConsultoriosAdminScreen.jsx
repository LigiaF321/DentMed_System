import React, { useEffect, useMemo, useState } from "react";
import {
  obtenerConsultoriosAdmin,
  crearConsultorioAdmin,
  actualizarConsultorioAdmin,
  eliminarConsultorioAdmin,
  cambiarMantenimientoConsultorioAdmin,
  cambiarEstadoConsultorioAdmin,
  obtenerHistorialConsultorioAdmin,
} from "../../services/adminConsultorios.service";
import "./ConsultoriosAdminScreen.css";

const ESTADOS_CONSULTORIO = [
  { value: "disponible", label: "Disponible" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "limpieza", label: "Limpieza" },
];

const ESTADOS_EQUIPO = [
  { value: "disponible", label: "Disponible" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "dañado", label: "Dañado" },
];

const normalizarTexto = (texto) =>
  String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizarEstado = (estado) => String(estado || "").trim().toLowerCase();

const getSemaforoClase = (estado) => {
  const valor = normalizarEstado(estado);
  if (valor === "mantenimiento") return "gris";
  if (valor === "limpieza") return "amarillo";
  if (valor === "ocupado") return "rojo";
  return "verde";
};

const getEquipoIcon = (nombreEquipo) => {
  const nombre = normalizarTexto(nombreEquipo);

  if (nombre.includes("rayos x") || nombre.includes("radiografia")) {
    return "fas fa-x-ray";
  }
  if (nombre.includes("lampara")) {
    return "fas fa-lightbulb";
  }
  if (nombre.includes("ultrasonido")) {
    return "fas fa-wave-square";
  }
  if (nombre.includes("camara")) {
    return "fas fa-camera";
  }
  if (nombre.includes("sillon")) {
    return "fas fa-chair";
  }
  return "fas fa-tools";
};

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  loading = false,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="consultorios-admin-overlay" onClick={loading ? undefined : onClose}>
      <div
        className="consultorios-admin-modal consultorios-admin-confirm"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="consultorios-admin-modal-header"
          style={{ borderLeftColor: danger ? "#dc2626" : "#2563eb" }}
        >
          <h3>{title}</h3>
          <button
            type="button"
            className="consultorios-admin-close"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="consultorios-admin-modal-body">
          <p>{message}</p>
        </div>

        <div className="consultorios-admin-modal-footer">
          <button
            type="button"
            className="consultorios-admin-btn consultorios-admin-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`consultorios-admin-btn ${
              danger
                ? "consultorios-admin-btn-danger"
                : "consultorios-admin-btn-primary"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const HistorialModal = ({ open, data, loading, onClose }) => {
  if (!open) return null;

  const historial = data?.historial || [];
  const consultorio = data?.consultorio || null;

  return (
    <div className="consultorios-admin-overlay" onClick={onClose}>
      <div
        className="consultorios-admin-modal consultorios-admin-modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="consultorios-admin-modal-header"
          style={{ borderLeftColor: "#2563eb" }}
        >
          <h3>
            Historial {consultorio ? `- ${consultorio.nombre}` : "de consultorio"}
          </h3>
          <button
            type="button"
            className="consultorios-admin-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="consultorios-admin-modal-body">
          {loading ? (
            <div className="consultorios-admin-empty">Cargando historial...</div>
          ) : historial.length === 0 ? (
            <div className="consultorios-admin-empty">
              No hay historial registrado para este consultorio.
            </div>
          ) : (
            <div className="consultorios-admin-history-list">
              {historial.map((item) => (
                <div key={item.id_cita} className="consultorios-admin-history-item">
                  <div className="consultorios-admin-history-top">
                    <strong>Cita #{item.id_cita}</strong>
                    <span className={`estado-pill estado-${normalizarEstado(item.estado)}`}>
                      {item.estado}
                    </span>
                  </div>

                  <div className="consultorios-admin-history-grid">
                    <div>
                      <span>Paciente</span>
                      <strong>{item.paciente?.nombre || "Paciente"}</strong>
                    </div>
                    <div>
                      <span>Fecha</span>
                      <strong>
                        {new Date(item.fecha_hora).toLocaleString("es-ES")}
                      </strong>
                    </div>
                    <div>
                      <span>Duración</span>
                      <strong>{item.duracion_estimada || 30} min</strong>
                    </div>
                    <div>
                      <span>Dentista</span>
                      <strong>#{item.id_dentista}</strong>
                    </div>
                  </div>

                  <div className="consultorios-admin-history-motivo">
                    <span>Motivo</span>
                    <p>{item.motivo || "Sin motivo registrado"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="consultorios-admin-modal-footer">
          <button
            type="button"
            className="consultorios-admin-btn consultorios-admin-btn-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const ConsultorioFormModal = ({
  open,
  mode,
  initialData,
  loading,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    nombre: "",
    capacidad: 1,
    estado: "disponible",
    equipos: [{ nombre_equipo: "", estado: "disponible" }],
  });

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        nombre: initialData.nombre || "",
        capacidad: Number(initialData.capacidad || 1),
        estado: normalizarEstado(initialData.estado || "disponible"),
        equipos:
          Array.isArray(initialData.equipos) && initialData.equipos.length > 0
            ? initialData.equipos.map((equipo) => ({
                nombre_equipo: equipo.nombre_equipo || "",
                estado: normalizarEstado(equipo.estado || "disponible"),
              }))
            : [{ nombre_equipo: "", estado: "disponible" }],
      });
    } else {
      setForm({
        nombre: "",
        capacidad: 1,
        estado: "disponible",
        equipos: [{ nombre_equipo: "", estado: "disponible" }],
      });
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "capacidad" ? Number(value) : value,
    }));
  };

  const handleEquipoChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      equipos: prev.equipos.map((equipo, i) =>
        i === index
          ? {
              ...equipo,
              [field]: value,
            }
          : equipo
      ),
    }));
  };

  const agregarEquipo = () => {
    setForm((prev) => ({
      ...prev,
      equipos: [...prev.equipos, { nombre_equipo: "", estado: "disponible" }],
    }));
  };

  const eliminarEquipo = (index) => {
    setForm((prev) => ({
      ...prev,
      equipos:
        prev.equipos.length === 1
          ? [{ nombre_equipo: "", estado: "disponible" }]
          : prev.equipos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      nombre: form.nombre.trim(),
      capacidad: Number(form.capacidad || 1),
      estado: normalizarEstado(form.estado),
      equipos: form.equipos
        .map((equipo) => ({
          nombre_equipo: String(equipo.nombre_equipo || "").trim(),
          estado: normalizarEstado(equipo.estado || "disponible"),
        }))
        .filter((equipo) => equipo.nombre_equipo.length > 0),
    };

    onSubmit(payload);
  };

  return (
    <div className="consultorios-admin-overlay" onClick={loading ? undefined : onClose}>
      <div
        className="consultorios-admin-modal consultorios-admin-modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="consultorios-admin-modal-header"
          style={{ borderLeftColor: "#2563eb" }}
        >
          <h3>{mode === "edit" ? "Editar consultorio" : "Nuevo consultorio"}</h3>
          <button
            type="button"
            className="consultorios-admin-close"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form className="consultorios-admin-form" onSubmit={handleSubmit}>
          <div className="consultorios-admin-form-grid">
            <div className="consultorios-admin-field">
              <label>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej. Consultorio 1"
                required
              />
            </div>

            <div className="consultorios-admin-field">
              <label>Capacidad</label>
              <input
                type="number"
                min="1"
                name="capacidad"
                value={form.capacidad}
                onChange={handleChange}
                required
              />
            </div>

            <div className="consultorios-admin-field consultorios-admin-field-full">
              <label>Estado</label>
              <select name="estado" value={form.estado} onChange={handleChange}>
                {ESTADOS_CONSULTORIO.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="consultorios-admin-equipos-header">
            <h4>Equipamiento</h4>
            <button
              type="button"
              className="consultorios-admin-btn consultorios-admin-btn-light"
              onClick={agregarEquipo}
            >
              <i className="fas fa-plus"></i> Agregar equipo
            </button>
          </div>

          <div className="consultorios-admin-equipos-list">
            {form.equipos.map((equipo, index) => (
              <div key={index} className="consultorios-admin-equipo-row">
                <div className="consultorios-admin-field">
                  <label>Equipo</label>
                  <input
                    type="text"
                    value={equipo.nombre_equipo}
                    onChange={(e) =>
                      handleEquipoChange(index, "nombre_equipo", e.target.value)
                    }
                    placeholder="Ej. Rayos X"
                  />
                </div>

                <div className="consultorios-admin-field">
                  <label>Estado</label>
                  <select
                    value={equipo.estado}
                    onChange={(e) =>
                      handleEquipoChange(index, "estado", e.target.value)
                    }
                  >
                    {ESTADOS_EQUIPO.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="consultorios-admin-icon-btn danger"
                  onClick={() => eliminarEquipo(index)}
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="consultorios-admin-modal-footer">
            <button
              type="button"
              className="consultorios-admin-btn consultorios-admin-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="consultorios-admin-btn consultorios-admin-btn-primary"
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : mode === "edit"
                ? "Guardar cambios"
                : "Crear consultorio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ConsultoriosAdminScreen() {
  const [consultorios, setConsultorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroEquipo, setFiltroEquipo] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [modoFormulario, setModoFormulario] = useState("create");
  const [consultorioEdicion, setConsultorioEdicion] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    danger: false,
    onConfirm: null,
  });

  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialData, setHistorialData] = useState(null);

  useEffect(() => {
    cargarConsultorios();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const cargarConsultorios = async () => {
    try {
      setLoading(true);
      const response = await obtenerConsultoriosAdmin();
      setConsultorios(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setToast(error.message || "No se pudieron cargar los consultorios");
      setConsultorios([]);
    } finally {
      setLoading(false);
    }
  };

  const equiposDisponibles = useMemo(() => {
    const lista = consultorios.flatMap((consultorio) =>
      Array.isArray(consultorio.equipos)
        ? consultorio.equipos.map((equipo) => equipo.nombre_equipo)
        : []
    );

    return [...new Set(lista)].sort((a, b) => a.localeCompare(b));
  }, [consultorios]);

  const consultoriosFiltrados = useMemo(() => {
    return consultorios.filter((consultorio) => {
      const coincideTexto =
        !search ||
        normalizarTexto(consultorio.nombre).includes(normalizarTexto(search));

      const coincideEstado =
        filtroEstado === "todos" ||
        normalizarEstado(consultorio.estado) === normalizarEstado(filtroEstado);

      const coincideEquipo =
        !filtroEquipo ||
        (consultorio.equipos || []).some(
          (equipo) =>
            normalizarTexto(equipo.nombre_equipo) ===
            normalizarTexto(filtroEquipo)
        );

      return coincideTexto && coincideEstado && coincideEquipo;
    });
  }, [consultorios, search, filtroEstado, filtroEquipo]);

  const abrirCrear = () => {
    setModoFormulario("create");
    setConsultorioEdicion(null);
    setShowFormModal(true);
  };

  const abrirEditar = (consultorio) => {
    setModoFormulario("edit");
    setConsultorioEdicion(consultorio);
    setShowFormModal(true);
  };

  const cerrarFormulario = () => {
    if (saving) return;
    setShowFormModal(false);
    setConsultorioEdicion(null);
  };

  const guardarConsultorio = async (payload) => {
    try {
      setSaving(true);

      if (modoFormulario === "edit" && consultorioEdicion) {
        const response = await actualizarConsultorioAdmin(
          consultorioEdicion.id,
          payload
        );

        setConsultorios((prev) =>
          prev.map((item) =>
            Number(item.id) === Number(consultorioEdicion.id)
              ? response.data
              : item
          )
        );

        setToast(response.message || "Consultorio actualizado correctamente");
      } else {
        const response = await crearConsultorioAdmin(payload);
        setConsultorios((prev) =>
          [...prev, response.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
        setToast(response.message || "Consultorio creado correctamente");
      }

      setShowFormModal(false);
      setConsultorioEdicion(null);
    } catch (error) {
      setToast(error.message || "No se pudo guardar el consultorio");
    } finally {
      setSaving(false);
    }
  };

  const abrirConfirmacion = (config) => {
    setConfirmConfig({
      open: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || "Confirmar",
      danger: !!config.danger,
      onConfirm: config.onConfirm,
    });
  };

  const cerrarConfirmacion = () => {
    if (saving) return;
    setConfirmConfig((prev) => ({
      ...prev,
      open: false,
      onConfirm: null,
    }));
  };

  const ejecutarConfirmacion = async () => {
    if (!confirmConfig.onConfirm) return;
    await confirmConfig.onConfirm();
  };

  const handleEliminar = (consultorio) => {
    abrirConfirmacion({
      title: "Eliminar consultorio",
      message: `¿Deseas eliminar "${consultorio.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      danger: true,
      onConfirm: async () => {
        try {
          setSaving(true);
          const response = await eliminarConsultorioAdmin(consultorio.id);
          setConsultorios((prev) =>
            prev.filter((item) => Number(item.id) !== Number(consultorio.id))
          );
          setToast(response.message || "Consultorio eliminado correctamente");
          cerrarConfirmacion();
        } catch (error) {
          setToast(error.message || "No se pudo eliminar el consultorio");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleToggleMantenimiento = (consultorio) => {
    const activo = normalizarEstado(consultorio.estado) !== "mantenimiento";

    abrirConfirmacion({
      title: activo ? "Activar mantenimiento" : "Desactivar mantenimiento",
      message: activo
        ? `¿Deseas poner "${consultorio.nombre}" en mantenimiento?`
        : `¿Deseas quitar "${consultorio.nombre}" de mantenimiento?`,
      confirmText: activo ? "Sí, activar" : "Sí, desactivar",
      danger: activo,
      onConfirm: async () => {
        try {
          setSaving(true);
          const response = await cambiarMantenimientoConsultorioAdmin(
            consultorio.id,
            activo
          );

          setConsultorios((prev) =>
            prev.map((item) =>
              Number(item.id) === Number(consultorio.id)
                ? response.data
                : item
            )
          );

          setToast(
            response.message || "Mantenimiento actualizado correctamente"
          );
          cerrarConfirmacion();
        } catch (error) {
          setToast(error.message || "No se pudo actualizar mantenimiento");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleCambiarEstado = async (consultorio, estado) => {
    try {
      setSaving(true);
      const response = await cambiarEstadoConsultorioAdmin(
        consultorio.id,
        estado
      );

      setConsultorios((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(consultorio.id) ? response.data : item
        )
      );

      setToast(response.message || "Estado actualizado correctamente");
    } catch (error) {
      setToast(error.message || "No se pudo cambiar el estado");
    } finally {
      setSaving(false);
    }
  };

  const handleVerHistorial = async (consultorio) => {
    try {
      setHistorialOpen(true);
      setHistorialLoading(true);
      setHistorialData(null);

      const response = await obtenerHistorialConsultorioAdmin(consultorio.id);
      setHistorialData(response.data || null);
    } catch (error) {
      setToast(error.message || "No se pudo cargar el historial");
      setHistorialOpen(false);
    } finally {
      setHistorialLoading(false);
    }
  };

  return (
    <div className="consultorios-admin-screen">
      <div className="consultorios-admin-topbar">
        <div>
          <h2>Consultorios</h2>
          <p>Gestiona catálogo, equipamiento, estado e historial.</p>
        </div>

        <button
          type="button"
          className="consultorios-admin-btn consultorios-admin-btn-primary"
          onClick={abrirCrear}
        >
          <i className="fas fa-plus"></i> Nuevo consultorio
        </button>
      </div>

      <div className="consultorios-admin-filters">
        <div className="consultorios-admin-field">
          <label>Buscar por nombre</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej. Consultorio 1"
          />
        </div>

        <div className="consultorios-admin-field">
          <label>Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            {ESTADOS_CONSULTORIO.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>

        <div className="consultorios-admin-field">
          <label>Equipo</label>
          <select
            value={filtroEquipo}
            onChange={(e) => setFiltroEquipo(e.target.value)}
          >
            <option value="">Todos</option>
            {equiposDisponibles.map((equipo) => (
              <option key={equipo} value={equipo}>
                {equipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="consultorios-admin-empty">Cargando consultorios...</div>
      ) : consultoriosFiltrados.length === 0 ? (
        <div className="consultorios-admin-empty">
          No hay consultorios que coincidan con los filtros.
        </div>
      ) : (
        <div className="consultorios-admin-grid">
          {consultoriosFiltrados.map((consultorio) => (
            <div key={consultorio.id} className="consultorios-admin-card">
              <div className="consultorios-admin-card-header">
                <div>
                  <h3>{consultorio.nombre}</h3>
                  <span className="consultorios-admin-capacidad">
                    Capacidad: {consultorio.capacidad}
                  </span>
                </div>

                <div
                  className={`consultorios-admin-semaforo semaforo-${getSemaforoClase(
                    consultorio.estado
                  )}`}
                >
                  <span className="dot"></span>
                  <span>{consultorio.estado}</span>
                </div>
              </div>

              <div className="consultorios-admin-card-body">
                <div className="consultorios-admin-card-row">
                  <span>Equipos</span>
                  <strong>{consultorio.total_equipos || 0}</strong>
                </div>

                <div className="consultorios-admin-card-row">
                  <span>Equipos disponibles</span>
                  <strong>{consultorio.equipos_disponibles || 0}</strong>
                </div>

                <div className="consultorios-admin-card-row consultorios-admin-card-row-column">
                  <span>Equipamiento</span>
                  <div className="consultorios-admin-tags">
                    {(consultorio.equipos || []).length ? (
                      consultorio.equipos.map((equipo) => (
                        <span
                          key={equipo.id}
                          className={`consultorios-admin-tag equipo-${normalizarEstado(
                            equipo.estado
                          )}`}
                        >
                          <i className={getEquipoIcon(equipo.nombre_equipo)}></i>
                          {equipo.nombre_equipo}
                        </span>
                      ))
                    ) : (
                      <span className="consultorios-admin-tag empty">
                        Sin equipos registrados
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="consultorios-admin-card-footer">
                <button
                  type="button"
                  className="consultorios-admin-btn consultorios-admin-btn-light"
                  onClick={() => abrirEditar(consultorio)}
                >
                  <i className="fas fa-pen"></i> Editar
                </button>

                <button
                  type="button"
                  className="consultorios-admin-btn consultorios-admin-btn-light"
                  onClick={() => handleVerHistorial(consultorio)}
                >
                  <i className="fas fa-history"></i> Historial
                </button>

                <button
                  type="button"
                  className="consultorios-admin-btn consultorios-admin-btn-warning"
                  onClick={() => handleToggleMantenimiento(consultorio)}
                >
                  <i className="fas fa-tools"></i>{" "}
                  {normalizarEstado(consultorio.estado) === "mantenimiento"
                    ? "Quitar mantenimiento"
                    : "Mantenimiento"}
                </button>

                <button
                  type="button"
                  className="consultorios-admin-btn consultorios-admin-btn-danger"
                  onClick={() => handleEliminar(consultorio)}
                >
                  <i className="fas fa-trash-alt"></i> Eliminar
                </button>
              </div>

              <div className="consultorios-admin-state-change">
                <label>Cambiar estado</label>
                <select
                  value={normalizarEstado(consultorio.estado)}
                  onChange={(e) =>
                    handleCambiarEstado(consultorio, e.target.value)
                  }
                  disabled={saving}
                >
                  {ESTADOS_CONSULTORIO.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConsultorioFormModal
        open={showFormModal}
        mode={modoFormulario}
        initialData={consultorioEdicion}
        loading={saving}
        onClose={cerrarFormulario}
        onSubmit={guardarConsultorio}
      />

      <ConfirmDialog
        open={confirmConfig.open}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        danger={confirmConfig.danger}
        loading={saving}
        onClose={cerrarConfirmacion}
        onConfirm={ejecutarConfirmacion}
      />

      <HistorialModal
        open={historialOpen}
        data={historialData}
        loading={historialLoading}
        onClose={() => setHistorialOpen(false)}
      />

      {toast ? <div className="consultorios-admin-toast">{toast}</div> : null}
    </div>
  );
}