const { Op } = require("sequelize");
const {
  Cita,
  Paciente,
  Dentista,
  Bloque,
  Consultorio,
  PreReserva,
} = require("../models");

const ESTADOS_NO_DISPONIBLES = ["cancelada", "cancelado"];
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

const obtenerBloquesDelDiaParaValidar = async ({
  fechaHoraInicio,
  idDentista,
}) => {
  const { inicio, fin } = obtenerInicioYFinDia(fechaHoraInicio);

  return Bloque.findAll({
    where: {
      id_dentista: idDentista,
      activo: true,
      [Op.or]: [
        { fecha_inicio: { [Op.between]: [inicio, fin] } },
        { fecha_fin: { [Op.between]: [inicio, fin] } },
      ],
    },
  });
};

const obtenerDentistaIdDesdeRequest = async (req) => {
  const usuario = req.usuario || req.user || req.auth || null;

  if (!usuario) return null;

  if (usuario.id_dentista) return usuario.id_dentista;
  if (usuario.dentista_id) return usuario.dentista_id;

  if ((usuario.rol === "dentista" || usuario.role === "dentista") && usuario.id) {
    return usuario.id;
  }

  const dentista = await Dentista.findOne({
    where: { id_usuario: usuario.id },
    attributes: ["id"],
  });

  return dentista ? dentista.id : null;
};

const obtenerCitasDelDiaParaValidar = async ({
  fechaHoraInicio,
  idDentista,
  idConsultorio,
  excluirCitaId = null,
}) => {
  const { inicio, fin } = obtenerInicioYFinDia(fechaHoraInicio);

  const where = {
    fecha_hora: {
      [Op.between]: [inicio, fin],
    },
    estado: {
      [Op.notIn]: ["Cancelada", "cancelada"],
    },
  };

  const condiciones = [{ id_dentista: idDentista }];

  if (idConsultorio) {
    condiciones.push({ id_consultorio: idConsultorio });
  }

  where[Op.or] = condiciones;

  if (excluirCitaId) {
    where.id = {
      [Op.ne]: excluirCitaId,
    };
  }

  return Cita.findAll({
    where,
    order: [["fecha_hora", "ASC"]],
  });
};

const obtenerPreReservasActivasConCitas = async ({
  idConsultorio = null,
  excluirCitaId = null,
}) => {
  const wherePreReserva = {
    fecha_expiracion: {
      [Op.gt]: new Date(),
    },
  };

  if (idConsultorio) {
    wherePreReserva.id_consultorio = idConsultorio;
  }

  const preReservas = await PreReserva.findAll({
    where: wherePreReserva,
    attributes: ["id", "id_cita", "id_consultorio", "fecha_expiracion"],
    order: [["fecha_expiracion", "ASC"]],
  });

  if (!preReservas.length) {
    return [];
  }

  const idsCita = [
    ...new Set(preReservas.map((item) => item.id_cita).filter(Boolean)),
  ];

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
      if (ESTADOS_NO_DISPONIBLES.includes(estadoCita)) return null;

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

const validarConsultorioDisponible = async ({
  idConsultorio,
  inicioNuevaCita,
  finNuevaCita,
  excluirCitaId = null,
}) => {
  if (!idConsultorio) {
    return {
      ok: true,
      consultorio: null,
    };
  }

  const consultorio = await Consultorio.findByPk(idConsultorio);

  if (!consultorio) {
    return {
      ok: false,
      status: 404,
      message: "Consultorio no encontrado",
    };
  }

  const estadoConsultorio = normalizarEstado(consultorio.estado) || "disponible";

  if (estadoConsultorio === "mantenimiento" || estadoConsultorio === "limpieza") {
    return {
      ok: false,
      status: 409,
      message: `El consultorio está en ${estadoConsultorio}`,
    };
  }

  const { inicio, fin } = obtenerInicioYFinDia(inicioNuevaCita);

  const citasConsultorio = await Cita.findAll({
    where: {
      id_consultorio: idConsultorio,
      fecha_hora: {
        [Op.between]: [inicio, fin],
      },
      estado: {
        [Op.notIn]: ["Cancelada", "cancelada"],
      },
      ...(excluirCitaId
        ? {
            id: {
              [Op.ne]: excluirCitaId,
            },
          }
        : {}),
    },
    order: [["fecha_hora", "ASC"]],
  });

  const conflictoCitaConsultorio = citasConsultorio.find((cita) => {
    const inicioExistente = new Date(cita.fecha_hora);
    const finExistente = sumarMinutos(
      inicioExistente,
      Number(cita.duracion_estimada || 30)
    );

    return haySolapamiento(
      inicioNuevaCita,
      finNuevaCita,
      inicioExistente,
      finExistente
    );
  });

  if (conflictoCitaConsultorio) {
    return {
      ok: false,
      status: 409,
      message: "El consultorio ya está ocupado en ese horario",
    };
  }

  const preReservasActivas = await obtenerPreReservasActivasConCitas({
    idConsultorio,
    excluirCitaId,
  });

  const conflictoPreReserva = preReservasActivas.find((preReserva) => {
    const inicioPreReserva = new Date(preReserva.cita.fecha_hora);
    const finPreReserva = sumarMinutos(
      inicioPreReserva,
      Number(preReserva.cita.duracion_estimada || 30)
    );

    return haySolapamiento(
      inicioNuevaCita,
      finNuevaCita,
      inicioPreReserva,
      finPreReserva
    );
  });

  if (conflictoPreReserva) {
    return {
      ok: false,
      status: 409,
      message: "El consultorio tiene una pre-reserva activa en ese horario",
    };
  }

  return {
    ok: true,
    consultorio,
  };
};

const construirRespuestaCita = async (cita) => {
  const paciente = await Paciente.findByPk(cita.id_paciente, {
    attributes: ["id", "nombre", "telefono", "email"],
  });

  const duracion = Number(cita.duracion_estimada || 30);
  const fechaInicio = new Date(cita.fecha_hora);
  const fechaFin = sumarMinutos(fechaInicio, duracion);

  return {
    id: cita.id,
    id_paciente: cita.id_paciente,
    id_dentista: cita.id_dentista,
    id_consultorio: cita.id_consultorio,
    fecha_hora: fechaInicio,
    fecha_fin: fechaFin,
    estado: normalizarEstado(cita.estado || "Programada"),
    motivo: cita.motivo || "",
    duracion_estimada: duracion,
    paciente_nombre: paciente?.nombre || "Paciente",
    paciente: paciente
      ? {
          id: paciente.id,
          nombre: paciente.nombre,
          telefono: paciente.telefono || "",
          email: paciente.email || "",
        }
      : null,
  };
};

const verificarDisponibilidad = async (req, res) => {
  try {
    const { fecha, hora, duracion, id_dentista, id_consultorio } = req.query;

    if (!fecha || !hora || !duracion) {
      return res.status(400).json({
        ok: false,
        message: "fecha, hora y duracion son obligatorios",
      });
    }

    const idDentista = id_dentista || (await obtenerDentistaIdDesdeRequest(req));

    if (!idDentista) {
      return res.status(400).json({
        ok: false,
        message: "No se pudo determinar el dentista desde el token",
      });
    }

    const inicioNuevaCita = combinarFechaHora(fecha, hora);
    const finNuevaCita = sumarMinutos(inicioNuevaCita, Number(duracion));

    const bloquesDelDia = await obtenerBloquesDelDiaParaValidar({
      fechaHoraInicio: inicioNuevaCita,
      idDentista,
    });

    const conflictoBloque = bloquesDelDia.find((bloque) => {
      return haySolapamiento(
        inicioNuevaCita,
        finNuevaCita,
        new Date(bloque.fecha_inicio),
        new Date(bloque.fecha_fin)
      );
    });

    if (conflictoBloque) {
      return res.status(200).json({
        ok: true,
        disponible: false,
        message: `El dentista tiene un bloqueo: ${conflictoBloque.tipo}`,
      });
    }

    const citasDelDia = await obtenerCitasDelDiaParaValidar({
      fechaHoraInicio: inicioNuevaCita,
      idDentista,
      idConsultorio: id_consultorio || null,
    });

    const conflicto = citasDelDia.find((cita) => {
      const estado = normalizarEstado(cita.estado);

      if (ESTADOS_NO_DISPONIBLES.includes(estado)) {
        return false;
      }

      const inicioExistente = new Date(cita.fecha_hora);
      const finExistente = sumarMinutos(
        inicioExistente,
        Number(cita.duracion_estimada || 30)
      );

      return haySolapamiento(
        inicioNuevaCita,
        finNuevaCita,
        inicioExistente,
        finExistente
      );
    });

    if (conflicto) {
      return res.status(200).json({
        ok: true,
        disponible: false,
        message: "Ya existe una cita en ese horario",
      });
    }

    if (id_consultorio) {
      const validacionConsultorio = await validarConsultorioDisponible({
        idConsultorio: Number(id_consultorio),
        inicioNuevaCita,
        finNuevaCita,
      });

      if (!validacionConsultorio.ok) {
        return res.status(200).json({
          ok: true,
          disponible: false,
          message: validacionConsultorio.message,
        });
      }
    }

    return res.status(200).json({
      ok: true,
      disponible: true,
      message: "Horario disponible",
    });
  } catch (error) {
    console.error("Error al verificar disponibilidad:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al verificar disponibilidad",
    });
  }
};

const crearCita = async (req, res) => {
  try {
    const {
      id_paciente,
      fecha,
      hora,
      duracion,
      motivo,
      id_consultorio,
      preReserva,
    } = req.body;

    if (!id_paciente || !fecha || !hora || !duracion) {
      return res.status(400).json({
        ok: false,
        message: "id_paciente, fecha, hora y duracion son obligatorios",
      });
    }

    const idDentista = await obtenerDentistaIdDesdeRequest(req);

    if (!idDentista) {
      return res.status(400).json({
        ok: false,
        message: "No se pudo determinar el dentista desde el token",
      });
    }

    const inicioNuevaCita = combinarFechaHora(fecha, hora);
    const finNuevaCita = sumarMinutos(inicioNuevaCita, Number(duracion));

    const bloquesDelDia = await obtenerBloquesDelDiaParaValidar({
      fechaHoraInicio: inicioNuevaCita,
      idDentista,
    });

    const conflictoBloque = bloquesDelDia.find((bloque) => {
      return haySolapamiento(
        inicioNuevaCita,
        finNuevaCita,
        new Date(bloque.fecha_inicio),
        new Date(bloque.fecha_fin)
      );
    });

    if (conflictoBloque) {
      return res.status(409).json({
        ok: false,
        message: `No se puede agendar: Horario bloqueado por ${conflictoBloque.tipo}.`,
      });
    }

    const citasDelDia = await obtenerCitasDelDiaParaValidar({
      fechaHoraInicio: inicioNuevaCita,
      idDentista,
      idConsultorio: id_consultorio || null,
    });

    const conflicto = citasDelDia.find((cita) => {
      const estado = normalizarEstado(cita.estado);

      if (ESTADOS_NO_DISPONIBLES.includes(estado)) {
        return false;
      }

      const inicioExistente = new Date(cita.fecha_hora);
      const finExistente = sumarMinutos(
        inicioExistente,
        Number(cita.duracion_estimada || 30)
      );

      return haySolapamiento(
        inicioNuevaCita,
        finNuevaCita,
        inicioExistente,
        finExistente
      );
    });

    if (conflicto) {
      return res.status(409).json({
        ok: false,
        message: "Conflicto de horario. Ya existe una cita en ese rango.",
      });
    }

    if (id_consultorio) {
      const validacionConsultorio = await validarConsultorioDisponible({
        idConsultorio: Number(id_consultorio),
        inicioNuevaCita,
        finNuevaCita,
      });

      if (!validacionConsultorio.ok) {
        return res.status(validacionConsultorio.status || 409).json({
          ok: false,
          message: validacionConsultorio.message,
        });
      }
    }

    const nuevaCita = await Cita.create({
      id_paciente,
      id_dentista: idDentista,
      id_consultorio: id_consultorio ? Number(id_consultorio) : null,
      fecha_hora: inicioNuevaCita,
      estado: "Programada",
      motivo: motivo || null,
      duracion_estimada: Number(duracion),
    });

    if (preReserva && id_consultorio) {
      const fechaExpiracion = sumarMinutos(
        new Date(),
        MINUTOS_EXPIRACION_PRE_RESERVA
      );

      const preReservaExistente = await PreReserva.findOne({
        where: {
          id_cita: nuevaCita.id,
        },
      });

      if (preReservaExistente) {
        preReservaExistente.id_consultorio = Number(id_consultorio);
        preReservaExistente.fecha_expiracion = fechaExpiracion;
        await preReservaExistente.save();
      } else {
        await PreReserva.create({
          id_cita: nuevaCita.id,
          id_consultorio: Number(id_consultorio),
          fecha_expiracion: fechaExpiracion,
        });
      }
    }

    const citaRespuesta = await construirRespuestaCita(nuevaCita);

    const { inicio, fin } = obtenerInicioYFinDia(inicioNuevaCita);

    const totalCitasHoy = await Cita.count({
      where: {
        id_dentista: idDentista,
        fecha_hora: {
          [Op.between]: [inicio, fin],
        },
        estado: {
          [Op.notIn]: ["Cancelada", "cancelada"],
        },
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Cita creada correctamente",
      data: citaRespuesta,
      primeraCitaDelDia: totalCitasHoy === 1,
      selectedCita: totalCitasHoy === 1 ? citaRespuesta : null,
    });
  } catch (error) {
    console.error("Error al crear cita:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear la cita",
    });
  }
};

const cancelarCita = async (req, res) => {
  try {
    const { id } = req.params;

    const cita = await Cita.findByPk(id);

    if (!cita) {
      return res.status(404).json({
        ok: false,
        message: "Cita no encontrada",
      });
    }

    const estadoActual = normalizarEstado(cita.estado);

    if (ESTADOS_NO_DISPONIBLES.includes(estadoActual)) {
      return res.status(409).json({
        ok: false,
        message: "La cita ya está cancelada",
      });
    }

    const idConsultorioAnterior = cita.id_consultorio;

    cita.estado = "Cancelada";
    cita.id_consultorio = null;

    await cita.save();

    await PreReserva.destroy({
      where: {
        id_cita: cita.id,
      },
    });

    const citaRespuesta = await construirRespuestaCita(cita);

    return res.status(200).json({
      ok: true,
      message: "Cita cancelada correctamente y consultorio liberado",
      data: {
        ...citaRespuesta,
        consultorio_liberado: idConsultorioAnterior,
      },
    });
  } catch (error) {
    console.error("Error al cancelar cita:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al cancelar la cita",
    });
  }
};

module.exports = {
  verificarDisponibilidad,
  crearCita,
  cancelarCita,
};