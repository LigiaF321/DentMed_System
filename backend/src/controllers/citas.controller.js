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
      notificar_paciente = true,
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
      notificar_paciente: Boolean(notificar_paciente),
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

const buscarHorariosDisponibles = async ({
  fechaInicial,
  idDentista,
  duracion = 30,
  idConsultorio = null,
  excluirCitaId = null,
  horaInicio = 6,
  horaFin = 20,
}) => {
  const INTERVALO_MINUTOS = 30;
  const horariosDisponibles = [];
  const diasABuscar = 4; // Día actual + 3 días siguientes

  try {
    for (let diaOffset = 0; diaOffset < diasABuscar; diaOffset++) {
      const fecha = new Date(fechaInicial);
      fecha.setDate(fecha.getDate() + diaOffset);

      // Validar que no sea fin de semana (opcional, según tus requerimientos)
      const diaSemana = fecha.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;

      const { inicio: inicioDelDia, fin: finDelDia } = obtenerInicioYFinDia(fecha);

      // Buscar bloqueos del día
      const bloquesDelDia = await Bloque.findAll({
        where: {
          id_dentista: idDentista,
          activo: true,
          [Op.or]: [
            { fecha_inicio: { [Op.between]: [inicioDelDia, finDelDia] } },
            { fecha_fin: { [Op.between]: [inicioDelDia, finDelDia] } },
          ],
        },
        attributes: ["fecha_inicio", "fecha_fin"],
      });

      // Buscar citas del día
      const citasDelDia = await Cita.findAll({
        where: {
          id_dentista: idDentista,
          fecha_hora: {
            [Op.between]: [inicioDelDia, finDelDia],
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
        attributes: ["fecha_hora", "duracion_estimada", "id_consultorio"],
      });

      // Buscar pre-reservas activas si hay consultorio
      let preReservasActivas = [];
      if (idConsultorio) {
        preReservasActivas = await obtenerPreReservasActivasConCitas({
          idConsultorio,
          excluirCitaId,
        }).then((preReservas) =>
          preReservas.filter((pr) => {
            const diaPreReserva = new Date(pr.cita.fecha_hora);
            const diaComparar = new Date(fecha);
            return (
              diaPreReserva.getDate() === diaComparar.getDate() &&
              diaPreReserva.getMonth() === diaComparar.getMonth() &&
              diaPreReserva.getFullYear() === diaComparar.getFullYear()
            );
          })
        );
      }

      // Verificar cada slot de 30 minutos
      for (let hora = horaInicio; hora < horaFin; hora++) {
        for (let minutos = 0; minutos < 60; minutos += INTERVALO_MINUTOS) {
          const fechaPrueba = new Date(fecha);
          fechaPrueba.setHours(hora, minutos, 0, 0);

          const finCitaPrueba = sumarMinutos(fechaPrueba, duracion);

          // Validar que no se salga del horario permitido
          if (finCitaPrueba.getHours() > horaFin) break;

          // Verificar conflicto con bloqueos
          const conflictoBloque = bloquesDelDia.some((bloque) => {
            return haySolapamiento(
              fechaPrueba,
              finCitaPrueba,
              new Date(bloque.fecha_inicio),
              new Date(bloque.fecha_fin)
            );
          });

          if (conflictoBloque) continue;

          // Verificar conflicto con citas
          const conflictoCita = citasDelDia.some((cita) => {
            const inicioCita = new Date(cita.fecha_hora);
            const finCita = sumarMinutos(
              inicioCita,
              Number(cita.duracion_estimada || 30)
            );

            // Si hay consultorio, validar que coincida
            if (idConsultorio && cita.id_consultorio) {
              if (Number(cita.id_consultorio) !== Number(idConsultorio)) {
                return false;
              }
            }

            return haySolapamiento(
              fechaPrueba,
              finCitaPrueba,
              inicioCita,
              finCita
            );
          });

          if (conflictoCita) continue;

          // Verificar conflicto con pre-reservas
          const conflictoPreReserva = preReservasActivas.some((pr) => {
            const inicioPreReserva = new Date(pr.cita.fecha_hora);
            const finPreReserva = sumarMinutos(
              inicioPreReserva,
              Number(pr.cita.duracion_estimada || 30)
            );

            return haySolapamiento(
              fechaPrueba,
              finCitaPrueba,
              inicioPreReserva,
              finPreReserva
            );
          });

          if (conflictoPreReserva) continue;

          // Si llegamos aquí, este slot está disponible
          horariosDisponibles.push({
            fecha: fechaPrueba.toISOString().split("T")[0],
            hora: `${String(hora).padStart(2, "0")}:${String(minutos).padStart(
              2,
              "0"
            )}`,
            displayFecha: fechaPrueba.toLocaleDateString("es-ES", {
              weekday: "short",
              day: "numeric",
              month: "short",
            }),
            displayHora: `${String(hora).padStart(2, "0")}:${String(minutos).padStart(
              2,
              "0"
            )}`,
          });

          // Limitar a 5 sugerencias
          if (horariosDisponibles.length >= 5) {
            return horariosDisponibles;
          }
        }
      }
    }

    return horariosDisponibles;
  } catch (error) {
    console.error("Error al buscar horarios disponibles:", error);
    return [];
  }
};

const reprogramarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, hora, duracion, motivo_reprogramacion, notificar_paciente } = req.body;

    if (!fecha || !hora || !duracion) {
      return res.status(400).json({
        ok: false,
        message: "fecha, hora y duracion son obligatorios",
      });
    }

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
        message: "No se puede reprogramar una cita cancelada",
      });
    }

    const inicioNuevaCita = combinarFechaHora(fecha, hora);
    const finNuevaCita = sumarMinutos(inicioNuevaCita, Number(duracion));

    // Obtener el dentista de la cita
    const idDentista = cita.id_dentista;

    // Validar bloqueos
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
      const horariosAlternativos = await buscarHorariosDisponibles({
        fechaInicial: inicioNuevaCita,
        idDentista,
        duracion: Number(duracion),
        idConsultorio: cita.id_consultorio || null,
        excluirCitaId: id,
      });

      return res.status(409).json({
        ok: false,
        message: `No se puede agendar: Horario bloqueado por ${conflictoBloque.tipo}.`,
        horariosAlternativos,
        hayAlternativas: horariosAlternativos.length > 0,
      });
    }

    // Validar conflictos con otras citas (excluyendo la actual)
    const citasDelDia = await obtenerCitasDelDiaParaValidar({
      fechaHoraInicio: inicioNuevaCita,
      idDentista,
      idConsultorio: cita.id_consultorio || null,
      excluirCitaId: id,
    });

    const conflicto = citasDelDia.find((citaExistente) => {
      const estado = normalizarEstado(citaExistente.estado);

      if (ESTADOS_NO_DISPONIBLES.includes(estado)) {
        return false;
      }

      const inicioExistente = new Date(citaExistente.fecha_hora);
      const finExistente = sumarMinutos(
        inicioExistente,
        Number(citaExistente.duracion_estimada || 30)
      );

      return haySolapamiento(
        inicioNuevaCita,
        finNuevaCita,
        inicioExistente,
        finExistente
      );
    });

    if (conflicto) {
      const horariosAlternativos = await buscarHorariosDisponibles({
        fechaInicial: inicioNuevaCita,
        idDentista,
        duracion: Number(duracion),
        idConsultorio: cita.id_consultorio || null,
        excluirCitaId: id,
      });

      return res.status(409).json({
        ok: false,
        message: "Conflicto de horario. Ya existe una cita en ese rango.",
        horariosAlternativos,
        hayAlternativas: horariosAlternativos.length > 0,
      });
    }

    // Validar consultorio si la cita tiene uno asignado
    if (cita.id_consultorio) {
      const validacionConsultorio = await validarConsultorioDisponible({
        idConsultorio: Number(cita.id_consultorio),
        inicioNuevaCita,
        finNuevaCita,
        excluirCitaId: id,
      });

      if (!validacionConsultorio.ok) {
        const horariosAlternativos = await buscarHorariosDisponibles({
          fechaInicial: inicioNuevaCita,
          idDentista,
          duracion: Number(duracion),
          idConsultorio: cita.id_consultorio || null,
          excluirCitaId: id,
        });

        return res.status(validacionConsultorio.status || 409).json({
          ok: false,
          message: validacionConsultorio.message,
          horariosAlternativos,
          hayAlternativas: horariosAlternativos.length > 0,
        });
      }
    }

    // Actualizar la cita
    cita.fecha_hora = inicioNuevaCita;
    cita.duracion_estimada = Number(duracion);
    cita.estado = "Reprogramada";
    
    // Agregar el motivo de reprogramación al motivo existente
    if (motivo_reprogramacion) {
      cita.motivo = motivo_reprogramacion;
    }

    // Establecer si se debe notificar al paciente
    if (typeof notificar_paciente !== 'undefined') {
      cita.notificar_paciente = Boolean(notificar_paciente);
    }

    await cita.save();

    const citaRespuesta = await construirRespuestaCita(cita);

    return res.status(200).json({
      ok: true,
      message: "Cita reprogramada correctamente",
      data: citaRespuesta,
    });
  } catch (error) {
    console.error("Error al reprogramar cita:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al reprogramar la cita",
    });
  }
};

const obtenerCitasDentista = async (req, res) => {
  try {
    const idDentista = await obtenerDentistaIdDesdeRequest(req);

    if (!idDentista) {
      return res.status(400).json({
        ok: false,
        message: "No se pudo determinar el dentista desde el token",
      });
    }

    const citas = await Cita.findAll({
      where: {
        id_dentista: idDentista,
      },
      include: [
        {
          model: Paciente,
          attributes: ["id", "nombre", "telefono", "email"],
        },
      ],
      order: [["fecha_hora", "ASC"]],
    });

    if (!citas || citas.length === 0) {
      return res.status(200).json({
        ok: true,
        data: [],
        message: "No hay citas registradas",
      });
    }

    // Transformar respuesta para incluir datos del paciente de forma clara
    const citasFormatadas = citas.map((cita) => {
      const duracion = Number(cita.duracion_estimada || 30);
      const fechaInicio = new Date(cita.fecha_hora);
      const fechaFin = sumarMinutos(fechaInicio, duracion);

      return {
        id: cita.id,
        id_paciente: cita.id_paciente,
        id_dentista: cita.id_dentista,
        id_consultorio: cita.id_consultorio,
        fecha_hora: cita.fecha_hora,
        fecha_fin: fechaFin,
        estado: normalizarEstado(cita.estado || "Programada"),
        motivo: cita.motivo || "",
        duracion_estimada: duracion,
        paciente_nombre: cita.Paciente?.nombre || "Paciente",
        paciente: cita.Paciente
          ? {
              id: cita.Paciente.id,
              nombre: cita.Paciente.nombre,
              telefono: cita.Paciente.telefono || "",
              email: cita.Paciente.email || "",
            }
          : null,
      };
    });

    return res.status(200).json({
      ok: true,
      data: citasFormatadas,
      message: `${citasFormatadas.length} cita(s) encontrada(s)`,
    });
  } catch (error) {
    console.error("Error al obtener citas del dentista:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener las citas",
    });
  }
};

module.exports = {
  verificarDisponibilidad,
  crearCita,
  cancelarCita,
  reprogramarCita,
  obtenerCitasDentista,
};