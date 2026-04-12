import React, { useEffect, useMemo, useRef, useState } from "react";
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
  obtenerEquipamientoConsultorios,
  filtrarConsultoriosPorEquipamiento,
} from "../../services/consultorios.service";
import "./NuevaCitaModal.css";

const DURACIONES = [30, 45, 60];

const getToday = () => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

const normalizarEstado = (estado) => String(estado || "").trim().toLowerCase();

const normalizarTexto = (texto) =>
  String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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

  if (estadoOperativo === "mantenimiento") return " - Mantenimiento";
  if (estadoOperativo === "limpieza") return " - Limpieza";
  if (estadoVisual === "ocupado") return " - Ocupado";
  return " - Libre";
};

const obtenerIconoEquipo = (nombreEquipo) => {
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

const obtenerTextoEstadoEquipo = (estado) => {
  const valor = normalizarEstado(estado);

  if (valor === "mantenimiento") return " - Mantenimiento";
  if (valor === "dañado" || valor === "danado") return "Dañado";
  return " - Disponible";
};

const obtenerEquiposRequeridosPorProcedimiento = (procedimiento) => {
  const texto = normalizarTexto(procedimiento);

  if (!texto) return [];

  const requeridos = [];

  if (
    texto.includes("rayos x") ||
    texto.includes("radiografia") ||
    texto.includes("panoramica") ||
    texto.includes("periapical")
  ) {
    requeridos.push("Rayos X");
  }

  if (
    texto.includes("limpieza") ||
    texto.includes("profilaxis") ||
    texto.includes("sarro") ||
    texto.includes("destartraje") ||
    texto.includes("ultrasonido")
  ) {
    requeridos.push("Ultrasonido");
  }

  if (
    texto.includes("extraccion") ||
    texto.includes("cirugia") ||
    texto.includes("quirurg")
  ) {
    requeridos.push("Lámpara LED");
  }

  if (
    texto.includes("fotografia") ||
    texto.includes("camara intraoral") ||
    texto.includes("camara")
  ) {
    requeridos.push("Cámara Intraoral");
  }

  return [...new Set(requeridos)];
};

const enriquecerConsultoriosConEquipos = (lista, catalogoEquipamiento) => {
  const mapaEquipos = new Map(
    (catalogoEquipamiento || []).map((item) => [
      String(item.id),
      Array.isArray(item.equipos) ? item.equipos : [],
    ])
  );

  return (lista || []).map((consultorio) => {
    const equipos = mapaEquipos.get(String(consultorio.id)) || [];

    const equipamientoDisponible = equipos
      .filter((equipo) => normalizarEstado(equipo.estado) === "disponible")
      .map((equipo) => equipo.nombre_equipo);

    return {
      ...consultorio,
      equipos,
      equipamiento:
        equipamientoDisponible.length > 0
          ? equipamientoDisponible
          : consultorio.equipamiento || [],
    };
  });
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
    notificar_paciente: true,
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

  const [consultoriosDisponibles, setConsultoriosDisponibles] = useState([]);
  const [catalogoEquipamiento, setCatalogoEquipamiento] = useState([]);
  const [consultoriosCompatiblesEquipo, setConsultoriosCompatiblesEquipo] = useState([]);
  const [conflictoSimultaneo, setConflictoSimultaneo] = useState(null);

  const pollingRef = useRef(null);

  const consultorioSeleccionado = useMemo(() => {
    return consultoriosDisponibles.find(
      (c) => String(c.id) === String(form.id_consultorio)
    );
  }, [consultoriosDisponibles, form.id_consultorio]);

  const equiposConsultorioSeleccionado = useMemo(() => {
    return Array.isArray(consultorioSeleccionado?.equipos)
      ? consultorioSeleccionado.equipos
      : [];
  }, [consultorioSeleccionado]);

  const equiposRequeridos = useMemo(() => {
    return obtenerEquiposRequeridosPorProcedimiento(form.motivo);
  }, [form.motivo]);

  const advertenciasEquipamiento = useMemo(() => {
    if (!equiposRequeridos.length || !consultorioSeleccionado) return [];

    return equiposRequeridos
      .map((equipoRequerido) => {
        const equipoEncontrado = equiposConsultorioSeleccionado.find(
          (equipo) =>
            normalizarTexto(equipo.nombre_equipo) ===
            normalizarTexto(equipoRequerido)
        );

        if (!equipoEncontrado) {
          return `El procedimiento requiere ${equipoRequerido}, pero este consultorio no lo tiene.`;
        }

        const estadoEquipo = normalizarEstado(equipoEncontrado.estado);

        if (estadoEquipo !== "disponible") {
          return `${equipoRequerido} está en ${obtenerTextoEstadoEquipo(
            equipoEncontrado.estado
          ).toLowerCase()}.`;
        }

        return null;
      })
      .filter(Boolean);
  }, [equiposRequeridos, equiposConsultorioSeleccionado, consultorioSeleccionado]);

  const hayFiltroPorEquipo = equiposRequeridos.length > 0;

  const idsCompatiblesSet = useMemo(() => {
    return new Set(consultoriosCompatiblesEquipo.map(String));
  }, [consultoriosCompatiblesEquipo]);

  const consultoriosAlternativosCompatibles = useMemo(() => {
    return consultoriosDisponibles.filter((consultorio) => {
      if (String(consultorio.id) === String(form.id_consultorio)) {
        return false;
      }

      if (esConsultorioBloqueado(consultorio)) {
        return false;
      }

      if (!hayFiltroPorEquipo) {
        return true;
      }

      return idsCompatiblesSet.has(String(consultorio.id));
    });
  }, [
    consultoriosDisponibles,
    form.id_consultorio,
    hayFiltroPorEquipo,
    idsCompatiblesSet,
  ]);

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
      notificar_paciente: true,
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
    setConflictoSimultaneo(null);
    setConsultoriosDisponibles(Array.isArray(consultorios) ? consultorios : []);
    setCatalogoEquipamiento([]);
    setConsultoriosCompatiblesEquipo([]);
  }, [open, consultorios]);

  useEffect(() => {
    if (!open) return;

    let cancelado = false;

    const cargarEquipamiento = async () => {
      try {
        const response = await obtenerEquipamientoConsultorios();

        if (!cancelado) {
          setCatalogoEquipamiento(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (error) {
        if (!cancelado) {
          setCatalogoEquipamiento([]);
        }
      }
    };

    cargarEquipamiento();

    return () => {
      cancelado = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelado = false;

    const cargarCompatiblesPorEquipo = async () => {
      try {
        if (!equiposRequeridos.length) {
          if (!cancelado) {
            setConsultoriosCompatiblesEquipo([]);
          }
          return;
        }

        const resultados = await Promise.all(
          equiposRequeridos.map((equipo) =>
            filtrarConsultoriosPorEquipamiento(equipo)
          )
        );

        const mapas = resultados.map((res) =>
          Array.isArray(res?.data) ? res.data : []
        );

        const idsCompatibles = mapas.reduce((acc, lista, index) => {
          const idsDisponibles = new Set(
            lista
              .filter((item) => item.equipo_disponible)
              .map((item) => String(item.id))
          );

          if (index === 0) {
            return idsDisponibles;
          }

          return new Set([...acc].filter((id) => idsDisponibles.has(id)));
        }, new Set());

        if (!cancelado) {
          setConsultoriosCompatiblesEquipo([...idsCompatibles]);
        }
      } catch (error) {
        if (!cancelado) {
          setConsultoriosCompatiblesEquipo([]);
        }
      }
    };

    cargarCompatiblesPorEquipo();

    return () => {
      cancelado = true;
    };
  }, [open, equiposRequeridos]);

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

        const listaEnriquecida = enriquecerConsultoriosConEquipos(
          lista,
          catalogoEquipamiento
        );

        setConsultoriosDisponibles(listaEnriquecida);

        setForm((prev) => {
          if (prev.id_consultorio) {
            const actual = listaEnriquecida.find(
              (c) => String(c.id) === String(prev.id_consultorio)
            );

            if (actual && !esConsultorioBloqueado(actual)) {
              return prev;
            }
          }

          const primerLibre = listaEnriquecida.find(
            (c) => !esConsultorioBloqueado(c)
          );

          return {
            ...prev,
            id_consultorio: primerLibre ? String(primerLibre.id) : "",
          };
        });
      } catch (err) {
        if (!cancelado) {
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
  }, [open, form.fecha, form.hora, form.duracion, catalogoEquipamiento]);

  useEffect(() => {
    if (!open) return;
    if (form.paciente) return;

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
        setResultados([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
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
      const finC = new Date(
        inicioC.getTime() + Number(c.duracion_estimada) * 60000
      );

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

  const canSave = useMemo(() => {
    return (
      !!form.paciente &&
      !!form.fecha &&
      !!form.hora &&
      !!form.duracion &&
      !!form.id_consultorio &&
      !!consultorioSeleccionado &&
      !esConsultorioBloqueado(consultorioSeleccionado) &&
      advertenciasEquipamiento.length === 0 &&
      disponibilidad.disponible &&
      !conflictoSimultaneo &&
      !saving
    );
  }, [
    form,
    consultorioSeleccionado,
    advertenciasEquipamiento,
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

    if (
      !consultorioSeleccionado ||
      esConsultorioBloqueado(consultorioSeleccionado)
    ) {
      setError("El consultorio seleccionado no está disponible.");
      return;
    }

    if (advertenciasEquipamiento.length > 0) {
      setError(advertenciasEquipamiento[0]);
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
        notificar_paciente: form.notificar_paciente,
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
      } catch (err) {}

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

              {!form.paciente && form.queryPaciente.trim().length >= 2 && !searching && (
  <div className="dm17-empty-search">
    {resultados.length === 0 && (
      <span>No se encontró el paciente.</span>
    )}

    <button
      type="button"
      className="dm17-link-btn"
      onClick={() => setShowCrearPaciente(true)}
    >
      Crear nuevo paciente
    </button>
  </div>
)}
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

                    <div style={{ marginTop: 10 }}>
                      <strong>Equipamiento disponible:</strong>
                    </div>

                    {equiposConsultorioSeleccionado.length ? (
                      <div className="dm26-equipos-grid">
                        {equiposConsultorioSeleccionado.map((equipo) => {
                          const estadoEquipo = normalizarEstado(equipo.estado);
                          const claseEstado =
                            estadoEquipo === "danado" ? "dañado" : estadoEquipo;

                          return (
                            <div
                              key={equipo.id}
                              className={`dm26-equipo-chip dm26-equipo-${claseEstado}`}
                            >
                              <i
                                className={obtenerIconoEquipo(
                                  equipo.nombre_equipo
                                )}
                              ></i>
                              <span>{equipo.nombre_equipo}</span>
                              <small>
                                {obtenerTextoEstadoEquipo(equipo.estado)}
                              </small>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ marginTop: 6 }}>
                        Sin equipamiento registrado
                      </div>
                    )}

                    {equiposRequeridos.length ? (
                      <div style={{ marginTop: 10 }}>
                        <strong>Equipo requerido por el procedimiento:</strong>
                        <div className="dm26-requeridos-wrap">
                          {equiposRequeridos.map((equipo) => (
                            <span key={equipo} className="dm26-requerido-chip">
                              <i className={obtenerIconoEquipo(equipo)}></i>{" "}
                              {equipo}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
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

                {equiposRequeridos.length > 0 ? (
                  <div className="dm26-filter-info">
                    <i className="fas fa-filter"></i>
                    <span>
                      Filtrando consultorios compatibles con:{" "}
                      <strong>{equiposRequeridos.join(", ")}</strong>
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {((consultorioSeleccionado &&
              esConsultorioBloqueado(consultorioSeleccionado)) ||
              !disponibilidad.disponible ||
              advertenciasEquipamiento.length > 0) && (
              <div className="dm17-sugeridos-list" style={{ marginTop: 12 }}>
                <div className="dm17-sugeridos-title">
                  Alternativas disponibles:
                </div>

                {consultoriosAlternativosCompatibles.map((c) => (
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