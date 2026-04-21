const { Op } = require("sequelize");
const {
  Consultorio,
  Cita,
  PreReserva,
  EquipoConsultorio,
  sequelize,
} = require("../models");

const ESTADOS_CANCELADOS = ["cancelada", "cancelado"];
const MINUTOS_EXPIRACION_PRE_RESERVA = 10;

const normalizarEstado = (estado) => String(estado || "").trim().toLowerCase();

const combinarFechaHora = (fecha, hora) => {
  const [year, month, day] = String(fecha).split("-").map(Number);
  const [hours, minutes] = String(hora).split(":").map(Number);

  return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
};

const sumarMinutos = (fecha, minutos) => {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setMinutes(nuevaFecha.getMinutes() + Number(minutos || 0));
  return nuevaFecha;
};

const haySolapamiento = (inicioA, finA, inicioB, finB) => {
  return inicioA < finB && inicioB < finA;
};

const obtenerInicioYFinDia = (fechaBase) => {
  const inicio = new Date(fechaBase);
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(fechaBase);
  fin.setHours(23, 59, 59, 999);

  return { inicio, fin };
};

const parsearEquipamiento = (consultorio) => {
  const valor = consultorio.equipamiento_json;

  if (Array.isArray(valor)) return valor;

  if (typeof valor === "string") {
    try {
      return JSON.parse(valor);
    } catch (error) {
      return [];
    }
  }

  return [];
};

const formatearConsultorioBase = (consultorio) => ({
  id: consultorio.id,
  nombre: consultorio.nombre,
  capacidad: consultorio.capacidad,
  equipamiento: parsearEquipamiento(consultorio),
  estado: consultorio.estado,
});

const formatearEquipo = (equipo) => ({
  id: equipo.id,
  id_consultorio: equipo.id_consultorio,
  nombre_equipo: equipo.nombre_equipo,
  estado: equipo.estado,
});

const agruparEquiposPorConsultorio = (consultorios, equipos) => {
  return consultorios.map((consultorio) => {
    const equiposConsultorio = equipos
      .filter(
        (equipo) => Number(equipo.id_consultorio) === Number(consultorio.id)
      )
      .map(formatearEquipo);

    return {
      ...formatearConsultorioBase(consultorio),
      equipos: equiposConsultorio,
    };
  });
};

const convertirFechaHoraCitaAParametros = (fechaHora) => {
  const fecha = new Date(fechaHora);

  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  const hh = String(fecha.getHours()).padStart(2, "0");
  const mi = String(fecha.getMinutes()).padStart(2, "0");

  return {
    fecha: `${yyyy}-${mm}-${dd}`,
    hora: `${hh}:${mi}`,
  };
};

const obtenerPreReservasActivasConCitas = async ({
  id_consultorio = null,
  excluirCitaId = null,
  excluirPreReservaId = null,
}) => {
  const wherePreReserva = {
    fecha_expiracion: {
      [Op.gt]: new Date(),
    },
  };

  if (id_consultorio) {
    wherePreReserva.id_consultorio = id_consultorio;
  }

  if (excluirPreReservaId) {
    wherePreReserva.id = {
      [Op.ne]: excluirPreReservaId,
    };
  }

  const preReservas = await PreReserva.findAll({
    where: wherePreReserva,
    attributes: ["id", "id_cita", "id_consultorio", "fecha_expiracion"],
    order: [["fecha_expiracion", "ASC"]],
  });

  if (!preReservas.length) {
    return [];
  }

  const idsCita = [...new Set(preReservas.map((item) => item.id_cita).filter(Boolean))];

  if (!idsCita.length) {
    return [];
  }

  const whereCitas = {
    id: idsCita,
  };

  if (excluirCitaId) {
    whereCitas.id = {
      [Op.in]: idsCita.filter((id) => Number(id) !== Number(excluirCitaId)),
    };
  }

  const citas = await Cita.findAll({
    where: whereCitas,
    attributes: [
      "id",
      "id_consultorio",
      "id_dentista",
      "id_paciente",
      "fecha_hora",
      "duracion_estimada",
      "estado",
      "motivo",
    ],
  });

  const mapaCitas = new Map(citas.map((cita) => [Number(cita.id), cita]));

  return preReservas
    .map((preReserva) => {
      const cita = mapaCitas.get(Number(preReserva.id_cita));
      if (!cita) return null;

      const estadoCita = normalizarEstado(cita.estado);
      if (ESTADOS_CANCELADOS.includes(estadoCita)) return null;

      return {
        id: preReserva.id,
        id_cita: preReserva.id_cita,
        id_consultorio: preReserva.id_consultorio,
        fecha_expiracion: preReserva.fecha_expiracion,
        cita,
      };
    })
    .filter(Boolean);
};

const validarDisponibilidadConsultorio = async ({
  id_consultorio,
  fecha,
  hora,
  duracion,
  excluirCitaId = null,
  excluirPreReservaId = null,
}) => {
  const consultorio = await Consultorio.findByPk(id_consultorio);

  if (!consultorio) {
    return {
      ok: false,
      status: 404,
      message: "Consultorio no encontrado",
    };
  }

  const estadoOperativo = normalizarEstado(consultorio.estado) || "disponible";

  if (estadoOperativo === "mantenimiento" || estadoOperativo === "limpieza") {
    return {
      ok: false,
      status: 409,
      message: `El consultorio está en ${estadoOperativo}`,
    };
  }

  const inicioConsulta = combinarFechaHora(fecha, hora);

  if (Number.isNaN(inicioConsulta.getTime())) {
    return {
      ok: false,
      status: 400,
      message: "Fecha u hora inválida",
    };
  }

  const finConsulta = sumarMinutos(inicioConsulta, duracion);
  const { inicio: inicioDia, fin: finDia } = obtenerInicioYFinDia(inicioConsulta);

  const whereCitas = {
    id_consultorio,
    fecha_hora: {
      [Op.between]: [inicioDia, finDia],
    },
  };

  if (excluirCitaId) {
    whereCitas.id = {
      [Op.ne]: excluirCitaId,
    };
  }

  const citas = await Cita.findAll({
    where: whereCitas,
    attributes: [
      "id",
      "id_consultorio",
      "id_dentista",
      "id_paciente",
      "fecha_hora",
      "duracion_estimada",
      "estado",
      "motivo",
    ],
    order: [["fecha_hora", "ASC"]],
  });

  const citaConflicto = citas.find((cita) => {
    const estadoCita = normalizarEstado(cita.estado);

    if (ESTADOS_CANCELADOS.includes(estadoCita)) {
      return false;
    }

    const inicioCita = new Date(cita.fecha_hora);
    const finCita = sumarMinutos(inicioCita, cita.duracion_estimada || 30);

    return haySolapamiento(inicioConsulta, finConsulta, inicioCita, finCita);
  });

  if (citaConflicto) {
    return {
      ok: false,
      status: 409,
      message: "El consultorio ya está ocupado en ese horario",
      conflicto: {
        tipo: "cita",
        id: citaConflicto.id,
        fecha_hora: citaConflicto.fecha_hora,
        duracion_estimada: citaConflicto.duracion_estimada,
        id_dentista: citaConflicto.id_dentista,
        id_paciente: citaConflicto.id_paciente,
        motivo: citaConflicto.motivo,
      },
    };
  }

  const preReservasActivas = await obtenerPreReservasActivasConCitas({
    id_consultorio,
    excluirCitaId,
    excluirPreReservaId,
  });

  const preReservaConflicto = preReservasActivas.find((preReserva) => {
    const inicioCitaPreReserva = new Date(preReserva.cita.fecha_hora);
    const finCitaPreReserva = sumarMinutos(
      inicioCitaPreReserva,
      preReserva.cita.duracion_estimada || 30
    );

    return haySolapamiento(
      inicioConsulta,
      finConsulta,
      inicioCitaPreReserva,
      finCitaPreReserva
    );
  });

  if (preReservaConflicto) {
    return {
      ok: false,
      status: 409,
      message: "El consultorio tiene una pre-reserva activa en ese horario",
      conflicto: {
        tipo: "pre_reserva",
        id: preReservaConflicto.id,
        id_cita: preReservaConflicto.id_cita,
        fecha_expiracion: preReservaConflicto.fecha_expiracion,
      },
    };
  }

  return {
    ok: true,
    consultorio,
  };
};

const listarConsultorios = async (req, res) => {
  try {
    const consultorios = await Consultorio.findAll({
      order: [["nombre", "ASC"]],
    });

    return res.status(200).json({
      ok: true,
      data: consultorios.map(formatearConsultorioBase),
    });
  } catch (error) {
    console.error("Error en listarConsultorios:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar consultorios",
    });
  }
};

const obtenerDisponibilidadConsultorios = async (req, res) => {
  try {
    const { fecha, hora, duracion } = req.query;

    if (!fecha || !hora || !duracion) {
      return res.status(400).json({
        ok: false,
        message: "Los parámetros fecha, hora y duracion son obligatorios",
      });
    }

    const inicioConsulta = combinarFechaHora(fecha, hora);

    if (Number.isNaN(inicioConsulta.getTime())) {
      return res.status(400).json({
        ok: false,
        message: "Fecha u hora inválida",
      });
    }

    const finConsulta = sumarMinutos(inicioConsulta, duracion);
    const { inicio: inicioDia, fin: finDia } = obtenerInicioYFinDia(inicioConsulta);

    const consultorios = await Consultorio.findAll({
      order: [["nombre", "ASC"]],
    });

    const citasDelDia = await Cita.findAll({
      where: {
        id_consultorio: {
          [Op.ne]: null,
        },
        fecha_hora: {
          [Op.between]: [inicioDia, finDia],
        },
      },
      attributes: [
        "id",
        "id_consultorio",
        "id_dentista",
        "id_paciente",
        "fecha_hora",
        "duracion_estimada",
        "estado",
        "motivo",
      ],
      order: [["fecha_hora", "ASC"]],
    });

    const preReservasActivas = await obtenerPreReservasActivasConCitas({});

    const data = consultorios.map((consultorio) => {
      const estadoOperativo = normalizarEstado(consultorio.estado) || "disponible";
      const base = formatearConsultorioBase(consultorio);

      if (estadoOperativo === "mantenimiento" || estadoOperativo === "limpieza") {
        return {
          ...base,
          estado_operativo: estadoOperativo,
          disponible: false,
          estado_visual: estadoOperativo,
          conflicto: null,
        };
      }

      const citaSolapada = citasDelDia.find((cita) => {
        if (Number(cita.id_consultorio) !== Number(consultorio.id)) {
          return false;
        }

        const estadoCita = normalizarEstado(cita.estado);
        if (ESTADOS_CANCELADOS.includes(estadoCita)) {
          return false;
        }

        const inicioCita = new Date(cita.fecha_hora);
        const finCita = sumarMinutos(inicioCita, cita.duracion_estimada || 30);

        return haySolapamiento(inicioConsulta, finConsulta, inicioCita, finCita);
      });

      if (citaSolapada) {
        return {
          ...base,
          estado_operativo: estadoOperativo,
          disponible: false,
          estado_visual: "ocupado",
          conflicto: {
            tipo: "cita",
            id: citaSolapada.id,
            fecha_hora: citaSolapada.fecha_hora,
            duracion_estimada: citaSolapada.duracion_estimada,
            id_dentista: citaSolapada.id_dentista,
            id_paciente: citaSolapada.id_paciente,
            motivo: citaSolapada.motivo,
          },
        };
      }

      const preReservaSolapada = preReservasActivas.find((preReserva) => {
        if (Number(preReserva.id_consultorio) !== Number(consultorio.id)) {
          return false;
        }

        const inicioCitaPreReserva = new Date(preReserva.cita.fecha_hora);
        const finCitaPreReserva = sumarMinutos(
          inicioCitaPreReserva,
          preReserva.cita.duracion_estimada || 30
        );

        return haySolapamiento(
          inicioConsulta,
          finConsulta,
          inicioCitaPreReserva,
          finCitaPreReserva
        );
      });

      if (preReservaSolapada) {
        return {
          ...base,
          estado_operativo: estadoOperativo,
          disponible: false,
          estado_visual: "ocupado",
          conflicto: {
            tipo: "pre_reserva",
            id: preReservaSolapada.id,
            id_cita: preReservaSolapada.id_cita,
            fecha_expiracion: preReservaSolapada.fecha_expiracion,
          },
        };
      }

      return {
        ...base,
        estado_operativo: estadoOperativo,
        disponible: true,
        estado_visual: "libre",
        conflicto: null,
      };
    });

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error en obtenerDisponibilidadConsultorios:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al consultar disponibilidad de consultorios",
    });
  }
};

const sugerirConsultorios = async (req, res) => {
  try {
    const { fecha, hora, duracion, equipamiento } = req.query;

    if (!fecha || !hora || !duracion) {
      return res.status(400).json({
        ok: false,
        message: "Los parámetros fecha, hora y duracion son obligatorios",
      });
    }

    const inicioConsulta = combinarFechaHora(fecha, hora);
    const finConsulta = sumarMinutos(inicioConsulta, duracion);
    const { inicio: inicioDia, fin: finDia } = obtenerInicioYFinDia(inicioConsulta);

    const consultorios = await Consultorio.findAll({
      order: [["capacidad", "ASC"], ["nombre", "ASC"]],
    });

    const citasDelDia = await Cita.findAll({
      where: {
        id_consultorio: {
          [Op.ne]: null,
        },
        fecha_hora: {
          [Op.between]: [inicioDia, finDia],
        },
      },
      attributes: [
        "id",
        "id_consultorio",
        "id_dentista",
        "id_paciente",
        "fecha_hora",
        "duracion_estimada",
        "estado",
        "motivo",
      ],
      order: [["fecha_hora", "ASC"]],
    });

    const preReservasActivas = await obtenerPreReservasActivasConCitas({});

    let equipamientoRequerido = [];

    if (equipamiento) {
      try {
        equipamientoRequerido = Array.isArray(equipamiento)
          ? equipamiento
          : JSON.parse(equipamiento);
      } catch (error) {
        equipamientoRequerido = String(equipamiento)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    const disponibles = consultorios
      .map((consultorio) => {
        const estadoOperativo = normalizarEstado(consultorio.estado) || "disponible";

        if (estadoOperativo === "mantenimiento" || estadoOperativo === "limpieza") {
          return null;
        }

        const citaSolapada = citasDelDia.find((cita) => {
          if (Number(cita.id_consultorio) !== Number(consultorio.id)) {
            return false;
          }

          const estadoCita = normalizarEstado(cita.estado);
          if (ESTADOS_CANCELADOS.includes(estadoCita)) {
            return false;
          }

          const inicioCita = new Date(cita.fecha_hora);
          const finCita = sumarMinutos(inicioCita, cita.duracion_estimada || 30);

          return haySolapamiento(inicioConsulta, finConsulta, inicioCita, finCita);
        });

        if (citaSolapada) {
          return null;
        }

        const preReservaSolapada = preReservasActivas.find((preReserva) => {
          if (Number(preReserva.id_consultorio) !== Number(consultorio.id)) {
            return false;
          }

          const inicioCitaPreReserva = new Date(preReserva.cita.fecha_hora);
          const finCitaPreReserva = sumarMinutos(
            inicioCitaPreReserva,
            preReserva.cita.duracion_estimada || 30
          );

          return haySolapamiento(
            inicioConsulta,
            finConsulta,
            inicioCitaPreReserva,
            finCitaPreReserva
          );
        });

        if (preReservaSolapada) {
          return null;
        }

        const equipamientoConsultorio = parsearEquipamiento(consultorio);

        const scoreEquipamiento = equipamientoRequerido.length
          ? equipamientoRequerido.filter((item) =>
              equipamientoConsultorio
                .map((eq) => String(eq).toLowerCase())
                .includes(String(item).toLowerCase())
            ).length
          : 0;

        return {
          ...formatearConsultorioBase(consultorio),
          estado_operativo: estadoOperativo,
          disponible: true,
          estado_visual: "libre",
          score_equipamiento: scoreEquipamiento,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.score_equipamiento !== a.score_equipamiento) {
          return b.score_equipamiento - a.score_equipamiento;
        }

        if (a.capacidad !== b.capacidad) {
          return a.capacidad - b.capacidad;
        }

        return a.nombre.localeCompare(b.nombre);
      });

    return res.status(200).json({
      ok: true,
      data: disponibles,
    });
  } catch (error) {
    console.error("Error en sugerirConsultorios:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al sugerir consultorios",
    });
  }
};

const obtenerCalendarioConsultorios = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        ok: false,
        message: "Los parámetros fecha_inicio y fecha_fin son obligatorios",
      });
    }

    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return res.status(400).json({
        ok: false,
        message: "Rango de fechas inválido",
      });
    }

    const consultorios = await Consultorio.findAll({
      order: [["nombre", "ASC"]],
    });

    const citas = await Cita.findAll({
      where: {
        id_consultorio: {
          [Op.ne]: null,
        },
        fecha_hora: {
          [Op.between]: [inicio, fin],
        },
      },
      attributes: [
        "id",
        "id_consultorio",
        "id_dentista",
        "id_paciente",
        "fecha_hora",
        "duracion_estimada",
        "estado",
        "motivo",
      ],
      order: [["fecha_hora", "ASC"]],
    });

    const preReservasActivas = await obtenerPreReservasActivasConCitas({});

    const eventos = [];

    consultorios.forEach((consultorio) => {
      const estadoOperativo = normalizarEstado(consultorio.estado) || "disponible";

      if (estadoOperativo === "mantenimiento" || estadoOperativo === "limpieza") {
        eventos.push({
          id: `estado-consultorio-${consultorio.id}`,
          consultorio_id: consultorio.id,
          consultorio_nombre: consultorio.nombre,
          inicio,
          fin,
          estado_visual: estadoOperativo,
          tipo: "estado_consultorio",
          title: `${consultorio.nombre} - ${estadoOperativo}`,
        });
      }
    });

    citas.forEach((cita) => {
      const estadoCita = normalizarEstado(cita.estado);

      if (ESTADOS_CANCELADOS.includes(estadoCita)) {
        return;
      }

      const inicioCita = new Date(cita.fecha_hora);
      const finCita = sumarMinutos(inicioCita, cita.duracion_estimada || 30);

      eventos.push({
        id: `cita-${cita.id}`,
        consultorio_id: cita.id_consultorio,
        inicio: inicioCita,
        fin: finCita,
        estado_visual: "ocupado",
        tipo: "cita",
        cita_id: cita.id,
        id_dentista: cita.id_dentista,
        id_paciente: cita.id_paciente,
        motivo: cita.motivo,
        title: `Cita #${cita.id}`,
      });
    });

    preReservasActivas.forEach((preReserva) => {
      const inicioCita = new Date(preReserva.cita.fecha_hora);
      const finCita = sumarMinutos(inicioCita, preReserva.cita.duracion_estimada || 30);

      if (finCita <= inicio || inicioCita >= fin) {
        return;
      }

      eventos.push({
        id: `pre-reserva-${preReserva.id}`,
        consultorio_id: preReserva.id_consultorio,
        inicio: inicioCita,
        fin: finCita,
        estado_visual: "ocupado",
        tipo: "pre_reserva",
        pre_reserva_id: preReserva.id,
        id_cita: preReserva.id_cita,
        fecha_expiracion: preReserva.fecha_expiracion,
        title: `Pre-reserva #${preReserva.id}`,
      });
    });

    return res.status(200).json({
      ok: true,
      data: {
        consultorios: consultorios.map(formatearConsultorioBase),
        eventos,
      },
    });
  } catch (error) {
    console.error("Error en obtenerCalendarioConsultorios:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener calendario de consultorios",
    });
  }
};

const crearPreReserva = async (req, res) => {
  try {
    const { id_cita, id_consultorio } = req.body;

    if (!id_cita || !id_consultorio) {
      return res.status(400).json({
        ok: false,
        message: "id_cita e id_consultorio son obligatorios",
      });
    }

    const cita = await Cita.findByPk(id_cita);

    if (!cita) {
      return res.status(404).json({
        ok: false,
        message: "Cita no encontrada",
      });
    }

    const estadoCita = normalizarEstado(cita.estado);
    if (ESTADOS_CANCELADOS.includes(estadoCita)) {
      return res.status(409).json({
        ok: false,
        message: "No se puede crear pre-reserva para una cita cancelada",
      });
    }

    const { fecha, hora } = convertirFechaHoraCitaAParametros(cita.fecha_hora);
    const duracion = cita.duracion_estimada || 30;

    const validacion = await validarDisponibilidadConsultorio({
      id_consultorio,
      fecha,
      hora,
      duracion,
      excluirCitaId: cita.id,
    });

    if (!validacion.ok) {
      return res.status(validacion.status || 409).json(validacion);
    }

    const fechaExpiracion = sumarMinutos(new Date(), MINUTOS_EXPIRACION_PRE_RESERVA);

    const preReservaExistente = await PreReserva.findOne({
      where: {
        id_cita,
      },
    });

    let preReserva;

    if (preReservaExistente) {
      preReservaExistente.id_consultorio = id_consultorio;
      preReservaExistente.fecha_expiracion = fechaExpiracion;
      await preReservaExistente.save();
      preReserva = preReservaExistente;
    } else {
      preReserva = await PreReserva.create({
        id_cita,
        id_consultorio,
        fecha_expiracion: fechaExpiracion,
      });
    }

    return res.status(201).json({
      ok: true,
      message: "Pre-reserva creada con éxito",
      data: preReserva,
    });
  } catch (error) {
    console.error("Error en crearPreReserva:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear pre-reserva",
    });
  }
};

const actualizarConsultorioCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_consultorio } = req.body;

    if (!id_consultorio) {
      return res.status(400).json({
        ok: false,
        message: "id_consultorio es obligatorio",
      });
    }

    const cita = await Cita.findByPk(id);

    if (!cita) {
      return res.status(404).json({
        ok: false,
        message: "Cita no encontrada",
      });
    }

    const estadoCita = normalizarEstado(cita.estado);

    if (ESTADOS_CANCELADOS.includes(estadoCita)) {
      return res.status(409).json({
        ok: false,
        message: "No se puede asignar consultorio a una cita cancelada",
      });
    }

    const consultorio = await Consultorio.findByPk(id_consultorio);
    if (!consultorio) {
      return res.status(404).json({
        ok: false,
        message: "Consultorio no encontrado",
      });
    }

    cita.id_consultorio = id_consultorio;
    await cita.save();

    await PreReserva.destroy({
      where: {
        id_cita: cita.id,
      },
    });

    return res.status(200).json({
      ok: true,
      message: "Consultorio asignado correctamente a la cita",
      data: cita,
    });
  } catch (error) {
    console.error("Error en actualizarConsultorioCita:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar consultorio de la cita",
    });
  }
};

const eliminarPreReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const preReserva = await PreReserva.findByPk(id);

    if (!preReserva) {
      return res.status(404).json({
        ok: false,
        message: "Pre-reserva no encontrada",
      });
    }

    await preReserva.destroy();

    return res.status(200).json({
      ok: true,
      message: "Pre-reserva eliminada correctamente",
    });
  } catch (error) {
    console.error("Error en eliminarPreReserva:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar pre-reserva",
    });
  }
};

const listarEquipamientoConsultorios = async (req, res) => {
  try {
    const { id_consultorio } = req.query;

    const whereConsultorio = {};
    const whereEquipos = {};

    if (id_consultorio) {
      whereConsultorio.id = Number(id_consultorio);
      whereEquipos.id_consultorio = Number(id_consultorio);
    }

    const consultorios = await Consultorio.findAll({
      where: whereConsultorio,
      order: [["nombre", "ASC"]],
    });

    const equipos = await EquipoConsultorio.findAll({
      where: whereEquipos,
      order: [
        ["id_consultorio", "ASC"],
        ["nombre_equipo", "ASC"],
      ],
    });

    return res.status(200).json({
      ok: true,
      data: agruparEquiposPorConsultorio(consultorios, equipos),
    });
  } catch (error) {
    console.error("Error en listarEquipamientoConsultorios:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar el equipamiento de consultorios",
    });
  }
};

const actualizarEquiposConsultorio = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { equipos } = req.body;

    const consultorio = await Consultorio.findByPk(id, { transaction });

    if (!consultorio) {
      await transaction.rollback();
      return res.status(404).json({
        ok: false,
        message: "Consultorio no encontrado",
      });
    }

    if (!Array.isArray(equipos)) {
      await transaction.rollback();
      return res.status(400).json({
        ok: false,
        message: "El campo equipos debe ser un arreglo",
      });
    }

    const equiposNormalizados = equipos
      .map((equipo) => ({
        nombre_equipo: String(equipo?.nombre_equipo || "").trim(),
        estado: normalizarEstado(equipo?.estado || "disponible"),
      }))
      .filter((equipo) => equipo.nombre_equipo.length > 0)
      .map((equipo) => ({
        ...equipo,
        estado: ["disponible", "mantenimiento", "dañado"].includes(equipo.estado)
          ? equipo.estado
          : "disponible",
      }));

    await EquipoConsultorio.destroy({
      where: { id_consultorio: Number(id) },
      transaction,
    });

    if (equiposNormalizados.length > 0) {
      await EquipoConsultorio.bulkCreate(
        equiposNormalizados.map((equipo) => ({
          id_consultorio: Number(id),
          nombre_equipo: equipo.nombre_equipo,
          estado: equipo.estado,
        })),
        { transaction }
      );
    }

    const equiposActualizados = await EquipoConsultorio.findAll({
      where: { id_consultorio: Number(id) },
      order: [["nombre_equipo", "ASC"]],
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      ok: true,
      message: "Equipamiento actualizado correctamente",
      data: {
        consultorio: formatearConsultorioBase(consultorio),
        equipos: equiposActualizados.map(formatearEquipo),
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error en actualizarEquiposConsultorio:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar el equipamiento del consultorio",
    });
  }
};

const filtrarConsultoriosPorEquipamiento = async (req, res) => {
  try {
    const { equipo_requerido } = req.query;

    if (!equipo_requerido || !String(equipo_requerido).trim()) {
      return res.status(400).json({
        ok: false,
        message: "El parámetro equipo_requerido es obligatorio",
      });
    }

    const equipoBuscado = String(equipo_requerido).trim().toLowerCase();

    const equipos = await EquipoConsultorio.findAll({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("nombre_equipo")),
        equipoBuscado
      ),
      order: [["nombre_equipo", "ASC"]],
    });

    const idsConsultorios = [
      ...new Set(equipos.map((equipo) => Number(equipo.id_consultorio))),
    ];

    if (!idsConsultorios.length) {
      return res.status(200).json({
        ok: true,
        data: [],
      });
    }

    const consultorios = await Consultorio.findAll({
      where: {
        id: idsConsultorios,
      },
      order: [["nombre", "ASC"]],
    });

    const equiposTodos = await EquipoConsultorio.findAll({
      where: {
        id_consultorio: idsConsultorios,
      },
      order: [
        ["id_consultorio", "ASC"],
        ["nombre_equipo", "ASC"],
      ],
    });

    const data = consultorios.map((consultorio) => {
      const equiposConsultorio = equiposTodos
        .filter(
          (equipo) => Number(equipo.id_consultorio) === Number(consultorio.id)
        )
        .map(formatearEquipo);

      const tieneEquipoDisponible = equiposConsultorio.some(
        (equipo) =>
          String(equipo.nombre_equipo).trim().toLowerCase() === equipoBuscado &&
          normalizarEstado(equipo.estado) === "disponible"
      );

      return {
        ...formatearConsultorioBase(consultorio),
        equipos: equiposConsultorio,
        cumple_requerimiento: true,
        equipo_requerido: equipo_requerido,
        equipo_disponible: tieneEquipoDisponible,
      };
    });

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error en filtrarConsultoriosPorEquipamiento:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al filtrar consultorios por equipamiento",
    });
  }
};

module.exports = {
  listarConsultorios,
  obtenerDisponibilidadConsultorios,
  sugerirConsultorios,
  obtenerCalendarioConsultorios,
  crearPreReserva,
  actualizarConsultorioCita,
  eliminarPreReserva,
  listarEquipamientoConsultorios,
  actualizarEquiposConsultorio,
  filtrarConsultoriosPorEquipamiento,
};