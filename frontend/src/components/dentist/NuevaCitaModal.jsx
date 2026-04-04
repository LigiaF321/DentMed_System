import React, { useEffect, useMemo, useRef, useState } from "react";
import ConsultorioSugerido from "./ConsultorioSugerido";
import {
  buscarPacientes,
  crearPacienteRapido,
} from "../../services/pacientes.service";
import {
  verificarDisponibilidad,
  crearCita,
} from "../../services/citas.service";
import { registrarAuditoriaConsultorio } from "../../services/auditoria.service";
import {
  obtenerConsultorios,
  obtenerDisponibilidadConsultorios,
  sugerirConsultorios,
} from "../../services/consultorios.service";
import "./NuevaCitaModal.css";

const DURACIONES = [30, 45, 60];

const getToday = () => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

const normalizarEstado = (estado) => String(estado || "").trim().toLowerCase();

const esConsultorioBloqueado = (consultorio) => {
  const estadoOperativo = normalizarEstado(
    consultorio?.estado_operativo || consultorio?.estado
  );

  return (
    estadoOperativo === "mantenimiento" ||
    estadoOperativo === "limpieza" ||
    consultorio?.disponible === false
  );
};

const obtenerTextoEstadoConsultorio = (consultorio) => {
  const estadoVisual = normalizarEstado(consultorio?.estado_visual);
  const estadoOperativo = normalizarEstado(
    consultorio?.estado_operativo || consultorio?.estado
  );

  if (estadoOperativo === "mantenimiento") return "Mantenimiento";
  if (estadoOperativo === "limpieza") return "Limpieza";
  if (estadoVisual === "ocupado") return "Ocupado";
  return "Libre";
};

function CrearPacienteRapidoModal({
  open,
  onClose,
  onCreated,
  initialName = "",
}) {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        nombre: initialName || "",
        telefono: "",
        email: "",
      });
      setSaving(false);
      setError("");
    }
  }, [open, initialName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);

      const response = await crearPacienteRapido({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
      });

      if (response?.data) {
        onCreated(response.data);
      }

      onClose();
    } catch (err) {
      setError(err.message || "No se pudo crear el paciente");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="dm17-overlay">
      <div className="dm17-modal dm17-modal-small">
        <div className="dm17-modal-header">
          <h3>Crear nuevo paciente</h3>
          <button type="button" className="dm17-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="dm17-form" onSubmit={handleSubmit}>
          <div className="dm17-grid">
            <div className="dm17-field dm17-field-full">
              <label>Nombre completo</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ingrese el nombre del paciente"
                required
              />
            </div>

            <div className="dm17-field">
              <label>Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Ej. 9999-9999"
              />
            </div>

            <div className="dm17-field">
              <label>Correo</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          {error ? <div className="dm17-error">{error}</div> : null}

          <div className="dm17-actions">
            <button
              type="button"
              className="dm17-btn dm17-btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="dm17-btn dm17-btn-primary"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NuevaCitaModal({
  open,
  onClose,
  onCreated,
  consultorios = [],
  citasDentista = [],
}) {
  const [form, setForm] = useState({
    paciente: null,
    queryPaciente: "",
    fecha: getToday(),
    hora: "",
    duracion: 30,
    id_consultorio: "",
    motivo: "",
    preReserva: false,
  });

  const [resultados, setResultados] = useState([]);
  const [searching, setSearching] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCrearPaciente, setShowCrearPaciente] = useState(false);
  const [error, setError] = useState("");
  const [disponibilidad, setDisponibilidad] = useState({
    disponible: true,
    message: "",
  });

  const [consultoriosSugeridos, setConsultoriosSugeridos] = useState([]);
  const [sugiriendo, setSugiriendo] = useState(false);

  const [consultoriosDisponibles, setConsultoriosDisponibles] = useState([]);
  const [conflictoSimultaneo, setConflictoSimultaneo] = useState(null);

  const pollingRef = useRef(null);

  const consultorioSeleccionado = useMemo(() => {
    return consultoriosDisponibles.find(
      (c) => String(c.id) === String(form.id_consultorio)
    );
  }, [consultoriosDisponibles, form.id_consultorio]);

  useEffect(() => {
    if (!form.fecha || !form.hora) {
      setForm((prev) => ({ ...prev, preReserva: false }));
      return;
    }

    const now = new Date();
    const citaDate = new Date(`${form.fecha}T${form.hora}`);
    const diffMs = citaDate - now;
    const diffHrs = diffMs / (1000 * 60 * 60);

    const isPreReserva = diffHrs > 24 && diffHrs <= 24 * 7;

    setForm((prev) => ({
      ...prev,
      preReserva: isPreReserva,
    }));
  }, [form.fecha, form.hora]);

  useEffect(() => {
    if (!open) return;

    setForm({
      paciente: null,
      queryPaciente: "",
      fecha: getToday(),
      hora: "",
      duracion: 30,
      id_consultorio: "",
      motivo: "",
      preReserva: false,
    });

    setResultados([]);
    setSearching(false);
    setChecking(false);
    setSaving(false);
    setShowCrearPaciente(false);
    setError("");
    setDisponibilidad({
      disponible: true,
      message: "",
    });
    setConsultoriosSugeridos([]);
    setSugiriendo(false);
    setConflictoSimultaneo(null);
    setConsultoriosDisponibles(Array.isArray(consultorios) ? consultorios : []);
  }, [open, consultorios]);

  useEffect(() => {
    if (!open) return;

    let cancelado = false;

    const cargarConsultorios = async () => {
      try {
        let lista = [];

        if (form.fecha && form.hora && form.duracion) {
          const response = await obtenerDisponibilidadConsultorios({
            fecha: form.fecha,
            hora: form.hora,
            duracion: form.duracion,
          });

          lista = Array.isArray(response?.data) ? response.data : [];
        } else {
          const response = await obtenerConsultorios();

          lista = Array.isArray(response?.data)
            ? response.data.map((consultorioItem) => {
                const estadoOperativo = normalizarEstado(consultorioItem.estado);
                const bloqueado =
                  estadoOperativo === "mantenimiento" ||
                  estadoOperativo === "limpieza";

                return {
                  ...consultorioItem,
                  estado_operativo: estadoOperativo,
                  estado_visual: bloqueado ? estadoOperativo : "libre",
                  disponible: !bloqueado,
                };
              })
            : [];
        }

        if (cancelado) return;

        setConsultoriosDisponibles(lista);

        setForm((prev) => {
          if (prev.id_consultorio) {
            const actual = lista.find(
              (c) => String(c.id) === String(prev.id_consultorio)
            );

            if (actual && !esConsultorioBloqueado(actual)) {
              return prev;
            }
          }

          const primerLibre = lista.find((c) => !esConsultorioBloqueado(c));

          return {
            ...prev,
            id_consultorio: primerLibre ? String(primerLibre.id) : "",
          };
        });
      } catch (err) {
        if (!cancelado) {
          console.error("Error cargando disponibilidad de consultorios:", err);
          setConsultoriosDisponibles([]);
        }
      }
    };

    cargarConsultorios();

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(cargarConsultorios, 10000);

    return () => {
      cancelado = true;

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [open, form.fecha, form.hora, form.duracion]);

  useEffect(() => {
    if (!open) return;
    if (!form.paciente) {
      const query = form.queryPaciente.trim();

      if (query.length < 2) {
        setResultados([]);
        return;
      }

      const timer = setTimeout(async () => {
        try {
          setSearching(true);
          const response = await buscarPacientes(query);
          setResultados(response?.data || []);
        } catch (err) {
          console.error("Error buscando pacientes:", err);
          setResultados([]);
        } finally {
          setSearching(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [form.queryPaciente, form.paciente, open]);

  useEffect(() => {
    if (!form.fecha || !form.hora || !form.duracion || !form.id_consultorio) {
      setConflictoSimultaneo(null);
      return;
    }

    const inicio = new Date(`${form.fecha}T${form.hora}`);
    const fin = new Date(inicio.getTime() + Number(form.duracion) * 60000);

    const conflicto = (citasDentista || []).find((c) => {
      if (!c.fecha_hora || !c.duracion_estimada) return false;

      const inicioC = new Date(c.fecha_hora);
      const finC = new Date(inicioC.getTime() + Number(c.duracion_estimada) * 60000);

      return (
        c.id_consultorio &&
        String(c.id_consultorio) !== String(form.id_consultorio) &&
        inicio < finC &&
        fin > inicioC
      );
    });

    setConflictoSimultaneo(conflicto || null);
  }, [form.fecha, form.hora, form.duracion, form.id_consultorio, citasDentista]);

  useEffect(() => {
    if (!open) return;

    if (!form.fecha || !form.hora || !form.duracion || !form.id_consultorio) {
      setDisponibilidad({
        disponible: true,
        message: "",
      });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setChecking(true);

        const response = await verificarDisponibilidad({
          fecha: form.fecha,
          hora: form.hora,
          duracion: form.duracion,
          id_consultorio: form.id_consultorio,
        });

        setDisponibilidad({
          disponible: !!response.disponible,
          message: response.message || "",
        });
      } catch (err) {
        setDisponibilidad({
          disponible: false,
          message: err.message || "No se pudo verificar disponibilidad",
        });
      } finally {
        setChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.fecha, form.hora, form.duracion, form.id_consultorio, open]);

  useEffect(() => {
    if (!form.motivo || form.motivo.trim().length < 3) {
      setConsultoriosSugeridos([]);
      return;
    }

    let cancelado = false;
    setSugiriendo(true);

    sugerirConsultorios({
      procedimiento: form.motivo.trim(),
      fecha: form.fecha,
      hora: form.hora,
      duracion: form.duracion,
    })
      .then((res) => {
        if (!cancelado) {
          setConsultoriosSugeridos(res?.data || []);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setConsultoriosSugeridos([]);
        }
      })
      .finally(() => {
        if (!cancelado) {
          setSugiriendo(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [form.motivo, form.fecha, form.hora, form.duracion]);

  const canSave = useMemo(() => {
    return (
      !!form.paciente &&
      !!form.fecha &&
      !!form.hora &&
      !!form.duracion &&
      !!form.id_consultorio &&
      !!consultorioSeleccionado &&
      !esConsultorioBloqueado(consultorioSeleccionado) &&
      disponibilidad.disponible &&
      !conflictoSimultaneo &&
      !saving
    );
  }, [
    form,
    consultorioSeleccionado,
    disponibilidad.disponible,
    conflictoSimultaneo,
    saving,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const seleccionarPaciente = (paciente) => {
    setForm((prev) => ({
      ...prev,
      paciente,
      queryPaciente: paciente.nombre,
    }));
    setResultados([]);
  };

  const limpiarPaciente = () => {
    setForm((prev) => ({
      ...prev,
      paciente: null,
      queryPaciente: "",
    }));
    setResultados([]);
  };

  const handlePacienteCreado = (paciente) => {
    seleccionarPaciente(paciente);
    setShowCrearPaciente(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (conflictoSimultaneo) {
      setError(
        "Conflicto: Ya tienes una cita en otro consultorio en este horario."
      );
      return;
    }

    if (!consultorioSeleccionado || esConsultorioBloqueado(consultorioSeleccionado)) {
      setError("El consultorio seleccionado no está disponible.");
      return;
    }

    if (!canSave) return;

    try {
      setSaving(true);

      const response = await crearCita({
        id_paciente: form.paciente.id,
        fecha: form.fecha,
        hora: form.hora,
        duracion: Number(form.duracion),
        id_consultorio: Number(form.id_consultorio),
        motivo: form.motivo.trim(),
        preReserva: form.preReserva,
      });

      try {
        await registrarAuditoriaConsultorio({
          accion: "crear_cita",
          modulo: "Consultorios",
          detalle: `Cita creada para paciente ${form.paciente.nombre} (${form.paciente.id}), consultorio ${form.id_consultorio}, fecha ${form.fecha} ${form.hora}, motivo: ${form.motivo}`,
          resultado: "exito",
          id_usuario: response?.data?.id_dentista || null,
          metadatos: {
            id_cita: response?.data?.id,
            id_paciente: form.paciente.id,
            id_consultorio: form.id_consultorio,
            fecha: form.fecha,
            hora: form.hora,
            motivo: form.motivo,
            preReserva: form.preReserva,
          },
        });
      } catch (err) {
        console.warn("No se pudo registrar auditoría de consultorio", err);
      }

      if (onCreated) {
        onCreated(response);
      }

      onClose();
    } catch (err) {
      setError(err.message || "No se pudo crear la cita");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="dm17-overlay">
        <div className="dm17-modal">
          <div className="dm17-modal-header">
            <h3>Nueva cita</h3>
            <button type="button" className="dm17-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <form className="dm17-form" onSubmit={handleSubmit}>
            <div className="dm17-field dm17-field-full dm17-typeahead-wrap">
              <label>Paciente</label>

              <div className="dm17-typeahead-input-wrap">
                <input
                  type="text"
                  name="queryPaciente"
                  value={form.queryPaciente}
                  onChange={handleChange}
                  placeholder="Buscar por nombre, teléfono o correo"
                />

                {form.paciente ? (
                  <button
                    type="button"
                    className="dm17-chip-clear"
                    onClick={limpiarPaciente}
                  >
                    Cambiar
                  </button>
                ) : null}
              </div>

              {!form.paciente && searching ? (
                <div className="dm17-help">Buscando pacientes...</div>
              ) : null}

              {!form.paciente && resultados.length > 0 ? (
                <div className="dm17-typeahead-list">
                  {resultados.map((paciente) => (
                    <button
                      key={paciente.id}
                      type="button"
                      className="dm17-typeahead-item"
                      onClick={() => seleccionarPaciente(paciente)}
                    >
                      <strong>{paciente.nombre}</strong>
                      <span>
                        {paciente.telefono ||
                          paciente.email ||
                          "Sin información adicional"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {!form.paciente &&
              form.queryPaciente.trim().length >= 2 &&
              !searching &&
              resultados.length === 0 ? (
                <div className="dm17-empty-search">
                  <span>No se encontró el paciente.</span>
                  <button
                    type="button"
                    className="dm17-link-btn"
                    onClick={() => setShowCrearPaciente(true)}
                  >
                    Crear nuevo paciente
                  </button>
                </div>
              ) : null}
            </div>

            <div className="dm17-grid">
              <div className="dm17-field">
                <label>Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="dm17-field">
                <label>Hora</label>
                <input
                  type="time"
                  name="hora"
                  value={form.hora}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="dm17-field">
                <label>Duración</label>
                <select
                  name="duracion"
                  value={form.duracion}
                  onChange={handleChange}
                >
                  {DURACIONES.map((duracion) => (
                    <option key={duracion} value={duracion}>
                      {duracion} min
                    </option>
                  ))}
                </select>
              </div>

              <div className="dm17-field">
                <label>Consultorio</label>
                <select
                  name="id_consultorio"
                  value={form.id_consultorio}
                  onChange={handleChange}
                  required
                  disabled={!consultoriosDisponibles.length}
                >
                  <option value="">
                    {consultoriosDisponibles.length
                      ? "Seleccione"
                      : "No hay consultorios disponibles"}
                  </option>

                  {consultoriosDisponibles.map((consultorioItem) => (
                    <option
                      key={consultorioItem.id}
                      value={String(consultorioItem.id)}
                      disabled={esConsultorioBloqueado(consultorioItem)}
                    >
                      {consultorioItem.nombre} -{" "}
                      {obtenerTextoEstadoConsultorio(consultorioItem)}
                    </option>
                  ))}
                </select>

                {consultorioSeleccionado ? (
                  <div className="dm17-help" style={{ marginTop: 8 }}>
                    <strong>Estado:</strong>{" "}
                    {obtenerTextoEstadoConsultorio(consultorioSeleccionado)}
                    <br />
                    <strong>Equipamiento:</strong>{" "}
                    {consultorioSeleccionado.equipamiento?.length
                      ? consultorioSeleccionado.equipamiento.join(", ")
                      : "Sin equipamiento registrado"}
                  </div>
                ) : null}
              </div>

              <div className="dm17-field dm17-field-full">
                <label>Motivo / Procedimiento</label>
                <input
                  type="text"
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  placeholder="Ej. Limpieza, revisión, extracción"
                  autoComplete="off"
                />

                <ConsultorioSugerido
                  procedimiento={form.motivo}
                  consultorios={consultoriosSugeridos}
                  loading={sugiriendo}
                  onSelectConsultorio={(c) =>
                    setForm((prev) => ({
                      ...prev,
                      id_consultorio: String(c.id),
                    }))
                  }
                />
              </div>
            </div>

            {!consultoriosDisponibles.length ? (
              <div className="dm17-error">
                No hay consultorios disponibles para agendar.
              </div>
            ) : null}

            {checking ? (
              <div className="dm17-help">Verificando disponibilidad...</div>
            ) : null}

            {consultoriosDisponibles.length > 0 &&
            form.id_consultorio &&
            (() => {
              const consultorioSel = consultoriosDisponibles.find(
                (c) => String(c.id) === String(form.id_consultorio)
              );

              if (
                consultorioSel &&
                ["mantenimiento", "limpieza"].includes(
                  normalizarEstado(
                    consultorioSel.estado_operativo || consultorioSel.estado
                  )
                )
              ) {
                return (
                  <div
                    className="dm17-error"
                    style={{
                      fontWeight: "bold",
                      background: "#fff3cd",
                      color: "#856404",
                      border: "1px solid #ffeeba",
                    }}
                  >
                    El consultorio seleccionado está en{" "}
                    <b>
                      {obtenerTextoEstadoConsultorio(
                        consultorioSel
                      ).toLowerCase()}
                    </b>
                    .
                  </div>
                );
              }

              return null;
            })()}

            {!checking && !disponibilidad.disponible ? (
              <div className="dm17-error" style={{ fontWeight: "bold" }}>
                {disponibilidad.message}
              </div>
            ) : null}

            {conflictoSimultaneo ? (
              <div className="dm17-error" style={{ fontWeight: "bold" }}>
                Conflicto: Ya tienes una cita en otro consultorio en este
                horario.
              </div>
            ) : null}

            {((consultorioSeleccionado &&
              esConsultorioBloqueado(consultorioSeleccionado)) ||
              !disponibilidad.disponible) && (
              <div className="dm17-sugeridos-list" style={{ marginTop: 12 }}>
                <div className="dm17-sugeridos-title">
                  Alternativas disponibles:
                </div>

                {consultoriosDisponibles
                  .filter(
                    (c) =>
                      String(c.id) !== String(form.id_consultorio) &&
                      !esConsultorioBloqueado(c)
                  )
                  .map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className="dm17-sugerido-item"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          id_consultorio: String(c.id),
                        }))
                      }
                    >
                      <div className="dm17-sugerido-nombre">{c.nombre}</div>
                      <div className="dm17-sugerido-equipamiento">
                        {c.equipamiento?.join(", ") ||
                          "Sin equipamiento registrado"}
                      </div>
                      <div className="dm17-sugerido-disponibilidad disponible">
                        {obtenerTextoEstadoConsultorio(c)}
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {error ? <div className="dm17-error">{error}</div> : null}

            {form.preReserva ? (
              <div
                className="dm17-help"
                style={{
                  background: "#fffbe6",
                  color: "#b26a00",
                  border: "1px solid #ffe58f",
                  marginBottom: 10,
                }}
              >
                Esta cita será registrada como <b>pre-reserva provisional</b>.
              </div>
            ) : null}

            <div className="dm17-actions">
              <button
                type="button"
                className="dm17-btn dm17-btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="dm17-btn dm17-btn-primary"
                disabled={!canSave}
              >
                {saving ? "Guardando..." : "Guardar cita"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CrearPacienteRapidoModal
        open={showCrearPaciente}
        onClose={() => setShowCrearPaciente(false)}
        onCreated={handlePacienteCreado}
        initialName={form.queryPaciente}
      />
    </>
  );
}