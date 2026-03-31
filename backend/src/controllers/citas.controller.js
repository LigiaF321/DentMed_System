const { Op } = require("sequelize");
const { Cita, Paciente, Dentista } = require("../models");

const ESTADOS_NO_DISPONIBLES = ["cancelada"];

const normalizarEstado = (estado) => String(estado || "").trim().toLowerCase();

const combinarFechaHora = (fecha, hora) => {
  const [year, month, day] = String(fecha).split("-").map(Number);
  const [hours, minutes] = String(hora).split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
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

  return Cita.findAll({
    where,
    order: [["fecha_hora", "ASC"]],
  });
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
        message: "Ya existe una cita o un bloqueo en ese horario",
      });
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

    const nuevaCita = await Cita.create({
      id_paciente,
      id_dentista: idDentista,
      id_consultorio: id_consultorio || null,
      fecha_hora: inicioNuevaCita,
      estado: "Programada",
      motivo: motivo || null,
      duracion_estimada: Number(duracion),
    });

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

module.exports = {
  verificarDisponibilidad,
  crearCita,
};