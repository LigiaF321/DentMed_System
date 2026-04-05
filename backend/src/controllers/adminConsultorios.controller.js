const { Op } = require("sequelize");
const {
  sequelize,
  Consultorio,
  Cita,
  Paciente,
  EquipoConsultorio,
  PreReserva,
} = require("../models");

const ESTADOS_VALIDOS = ["disponible", "ocupado", "mantenimiento", "limpieza"];
const ESTADOS_CANCELADOS = ["cancelada", "cancelado"];

const normalizarEstado = (estado) => String(estado || "").trim().toLowerCase();

const parsearEquipamientoEntrada = (valor) => {
  if (Array.isArray(valor)) return valor;

  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return valor
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const obtenerEquipamientoLegacyDesdeEquipos = (equipos) => {
  return (equipos || [])
    .filter((equipo) => normalizarEstado(equipo.estado) === "disponible")
    .map((equipo) => equipo.nombre_equipo);
};

const formatearEquipo = (equipo) => ({
  id: equipo.id,
  id_consultorio: equipo.id_consultorio,
  nombre_equipo: equipo.nombre_equipo,
  estado: equipo.estado,
});

const formatearConsultorioAdmin = (consultorio, equipos = []) => ({
  id: consultorio.id,
  nombre: consultorio.nombre,
  capacidad: consultorio.capacidad,
  estado: consultorio.estado,
  equipamiento: Array.isArray(consultorio.equipamiento_json)
    ? consultorio.equipamiento_json
    : parsearEquipamientoEntrada(consultorio.equipamiento_json),
  equipos: equipos.map(formatearEquipo),
  total_equipos: equipos.length,
  equipos_disponibles: equipos.filter(
    (equipo) => normalizarEstado(equipo.estado) === "disponible"
  ).length,
  semaforo:
    normalizarEstado(consultorio.estado) === "mantenimiento"
      ? "gris"
      : normalizarEstado(consultorio.estado) === "limpieza"
      ? "amarillo"
      : normalizarEstado(consultorio.estado) === "ocupado"
      ? "rojo"
      : "verde",
});

const obtenerConsultorioConEquipos = async (id, transaction = null) => {
  const consultorio = await Consultorio.findByPk(id, { transaction });

  if (!consultorio) return null;

  const equipos = await EquipoConsultorio.findAll({
    where: { id_consultorio: Number(id) },
    order: [["nombre_equipo", "ASC"]],
    transaction,
  });

  return {
    consultorio,
    equipos,
  };
};

const listarConsultoriosAdmin = async (req, res) => {
  try {
    const consultorios = await Consultorio.findAll({
      order: [["nombre", "ASC"]],
    });

    const equipos = await EquipoConsultorio.findAll({
      order: [
        ["id_consultorio", "ASC"],
        ["nombre_equipo", "ASC"],
      ],
    });

    const data = consultorios.map((consultorio) => {
      const equiposConsultorio = equipos.filter(
        (equipo) => Number(equipo.id_consultorio) === Number(consultorio.id)
      );

      return formatearConsultorioAdmin(consultorio, equiposConsultorio);
    });

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error en listarConsultoriosAdmin:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar consultorios",
    });
  }
};

const crearConsultorioAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      nombre,
      capacidad,
      estado = "disponible",
      equipamiento_json = [],
      equipos = [],
    } = req.body;

    if (!nombre || !String(nombre).trim()) {
      await transaction.rollback();
      return res.status(400).json({
        ok: false,
        message: "El nombre del consultorio es obligatorio",
      });
    }

    const estadoNormalizado = normalizarEstado(estado);

    if (!ESTADOS_VALIDOS.includes(estadoNormalizado)) {
      await transaction.rollback();
      return res.status(400).json({
        ok: false,
        message: "Estado de consultorio no válido",
      });
    }

    const nombreExiste = await Consultorio.findOne({
      where: {
        nombre: String(nombre).trim(),
      },
      transaction,
    });

    if (nombreExiste) {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        message: "Ya existe un consultorio con ese nombre",
      });
    }

    const equiposNormalizados = Array.isArray(equipos)
      ? equipos
          .map((equipo) => ({
            nombre_equipo: String(equipo?.nombre_equipo || "").trim(),
            estado: normalizarEstado(equipo?.estado || "disponible"),
          }))
          .filter((equipo) => equipo.nombre_equipo.length > 0)
          .map((equipo) => ({
            ...equipo,
            estado: ["disponible", "mantenimiento", "dañado"].includes(
              equipo.estado
            )
              ? equipo.estado
              : "disponible",
          }))
      : [];

    const equipamientoLegacy =
      equiposNormalizados.length > 0
        ? obtenerEquipamientoLegacyDesdeEquipos(equiposNormalizados)
        : parsearEquipamientoEntrada(equipamiento_json);

    const nuevoConsultorio = await Consultorio.create(
      {
        nombre: String(nombre).trim(),
        capacidad: Number(capacidad || 1),
        estado: estadoNormalizado,
        equipamiento_json: equipamientoLegacy,
      },
      { transaction }
    );

    if (equiposNormalizados.length > 0) {
      await EquipoConsultorio.bulkCreate(
        equiposNormalizados.map((equipo) => ({
          id_consultorio: nuevoConsultorio.id,
          nombre_equipo: equipo.nombre_equipo,
          estado: equipo.estado,
        })),
        { transaction }
      );
    }

    const resultado = await obtenerConsultorioConEquipos(
      nuevoConsultorio.id,
      transaction
    );

    await transaction.commit();

    return res.status(201).json({
      ok: true,
      message: "Consultorio creado correctamente",
      data: formatearConsultorioAdmin(
        resultado.consultorio,
        resultado.equipos || []
      ),
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error en crearConsultorioAdmin:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear consultorio",
    });
  }
};

const actualizarConsultorioAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { nombre, capacidad, estado, equipamiento_json, equipos } = req.body;

    const consultorio = await Consultorio.findByPk(id, { transaction });

    if (!consultorio) {
      await transaction.rollback();
      return res.status(404).json({
        ok: false,
        message: "Consultorio no encontrado",
      });
    }

    if (nombre !== undefined) {
      const nombreLimpio = String(nombre || "").trim();

      if (!nombreLimpio) {
        await transaction.rollback();
        return res.status(400).json({
          ok: false,
          message: "El nombre del consultorio es obligatorio",
        });
      }

      const nombreExiste = await Consultorio.findOne({
        where: {
          nombre: nombreLimpio,
          id: {
            [Op.ne]: Number(id),
          },
        },
        transaction,
      });

      if (nombreExiste) {
        await transaction.rollback();
        return res.status(409).json({
          ok: false,
          message: "Ya existe otro consultorio con ese nombre",
        });
      }

      consultorio.nombre = nombreLimpio;
    }

    if (capacidad !== undefined) {
      consultorio.capacidad = Number(capacidad || 1);
    }

    if (estado !== undefined) {
      const estadoNormalizado = normalizarEstado(estado);

      if (!ESTADOS_VALIDOS.includes(estadoNormalizado)) {
        await transaction.rollback();
        return res.status(400).json({
          ok: false,
          message: "Estado de consultorio no válido",
        });
      }

      consultorio.estado = estadoNormalizado;
    }

    let equiposActualizados = null;

    if (equipos !== undefined) {
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
          estado: ["disponible", "mantenimiento", "dañado"].includes(
            equipo.estado
          )
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

      consultorio.equipamiento_json =
        obtenerEquipamientoLegacyDesdeEquipos(equiposNormalizados);

      equiposActualizados = equiposNormalizados;
    } else if (equipamiento_json !== undefined) {
      consultorio.equipamiento_json = parsearEquipamientoEntrada(equipamiento_json);
    }

    await consultorio.save({ transaction });

    const resultado = await obtenerConsultorioConEquipos(id, transaction);

    await transaction.commit();

    return res.status(200).json({
      ok: true,
      message: "Consultorio actualizado correctamente",
      data: formatearConsultorioAdmin(
        resultado.consultorio,
        resultado.equipos || []
      ),
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error en actualizarConsultorioAdmin:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar consultorio",
    });
  }
};

const eliminarConsultorioAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const consultorio = await Consultorio.findByPk(id, { transaction });

    if (!consultorio) {
      await transaction.rollback();
      return res.status(404).json({
        ok: false,
        message: "Consultorio no encontrado",
      });
    }

    const citasRelacionadas = await Cita.count({
      where: {
        id_consultorio: Number(id),
      },
      transaction,
    });

    if (citasRelacionadas > 0) {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        message:
          "No se puede eliminar el consultorio porque tiene historial de citas asociado",
      });
    }

    await PreReserva.destroy({
      where: {
        id_consultorio: Number(id),
      },
      transaction,
    });

    await EquipoConsultorio.destroy({
      where: {
        id_consultorio: Number(id),
      },
      transaction,
    });

    await consultorio.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      ok: true,
      message: "Consultorio eliminado correctamente",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error en eliminarConsultorioAdmin:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar consultorio",
    });
  }
};

const cambiarMantenimientoConsultorioAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const consultorio = await Consultorio.findByPk(id);

    if (!consultorio) {
      return res.status(404).json({
        ok: false,
        message: "Consultorio no encontrado",
      });
    }

    if (typeof activo !== "boolean") {
      return res.status(400).json({
        ok: false,
        message: "El campo activo debe ser booleano",
      });
    }

    if (activo) {
      const ahora = new Date();

      const citasFuturas = await Cita.count({
        where: {
          id_consultorio: Number(id),
          fecha_hora: {
            [Op.gte]: ahora,
          },
          estado: {
            [Op.notIn]: ["Cancelada", "cancelada"],
          },
        },
      });

      if (citasFuturas > 0) {
        return res.status(409).json({
          ok: false,
          message:
            "No se puede activar mantenimiento porque el consultorio tiene citas futuras activas",
        });
      }

      consultorio.estado = "mantenimiento";

      await PreReserva.destroy({
        where: {
          id_consultorio: Number(id),
        },
      });
    } else {
      if (normalizarEstado(consultorio.estado) === "mantenimiento") {
        consultorio.estado = "disponible";
      }
    }

    await consultorio.save();

    const resultado = await obtenerConsultorioConEquipos(id);

    return res.status(200).json({
      ok: true,
      message: activo
        ? "Mantenimiento activado correctamente"
        : "Mantenimiento desactivado correctamente",
      data: formatearConsultorioAdmin(
        resultado.consultorio,
        resultado.equipos || []
      ),
    });
  } catch (error) {
    console.error("Error en cambiarMantenimientoConsultorioAdmin:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar mantenimiento del consultorio",
    });
  }
};

const cambiarEstadoConsultorioAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const consultorio = await Consultorio.findByPk(id);

    if (!consultorio) {
      return res.status(404).json({
        ok: false,
        message: "Consultorio no encontrado",
      });
    }

    const estadoNormalizado = normalizarEstado(estado);

    if (!ESTADOS_VALIDOS.includes(estadoNormalizado)) {
      return res.status(400).json({
        ok: false,
        message: "Estado de consultorio no válido",
      });
    }

    if (["mantenimiento", "limpieza"].includes(estadoNormalizado)) {
      const ahora = new Date();

      const citasFuturas = await Cita.count({
        where: {
          id_consultorio: Number(id),
          fecha_hora: {
            [Op.gte]: ahora,
          },
          estado: {
            [Op.notIn]: ["Cancelada", "cancelada"],
          },
        },
      });

      if (citasFuturas > 0) {
        return res.status(409).json({
          ok: false,
          message:
            "No se puede cambiar el estado porque el consultorio tiene citas futuras activas",
        });
      }

      await PreReserva.destroy({
        where: {
          id_consultorio: Number(id),
        },
      });
    }

    consultorio.estado = estadoNormalizado;
    await consultorio.save();

    const resultado = await obtenerConsultorioConEquipos(id);

    return res.status(200).json({
      ok: true,
      message: "Estado del consultorio actualizado correctamente",
      data: formatearConsultorioAdmin(
        resultado.consultorio,
        resultado.equipos || []
      ),
    });
  } catch (error) {
    console.error("Error en cambiarEstadoConsultorioAdmin:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al cambiar estado del consultorio",
    });
  }
};

const obtenerHistorialConsultorioAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const consultorio = await Consultorio.findByPk(id);

    if (!consultorio) {
      return res.status(404).json({
        ok: false,
        message: "Consultorio no encontrado",
      });
    }

    const citas = await Cita.findAll({
      where: {
        id_consultorio: Number(id),
      },
      include: [
        {
          model: Paciente,
          attributes: ["id", "nombre", "telefono", "email"],
        },
      ],
      order: [["fecha_hora", "DESC"]],
    });

    const historial = citas.map((cita) => ({
      id_cita: cita.id,
      id_consultorio: cita.id_consultorio,
      id_dentista: cita.id_dentista,
      id_paciente: cita.id_paciente,
      fecha_hora: cita.fecha_hora,
      fecha_fin: new Date(
        new Date(cita.fecha_hora).getTime() +
          Number(cita.duracion_estimada || 30) * 60000
      ),
      estado: cita.estado,
      motivo: cita.motivo,
      duracion_estimada: cita.duracion_estimada,
      paciente: cita.Paciente
        ? {
            id: cita.Paciente.id,
            nombre: cita.Paciente.nombre,
            telefono: cita.Paciente.telefono || "",
            email: cita.Paciente.email || "",
          }
        : null,
    }));

    return res.status(200).json({
      ok: true,
      data: {
        consultorio: {
          id: consultorio.id,
          nombre: consultorio.nombre,
          capacidad: consultorio.capacidad,
          estado: consultorio.estado,
        },
        historial,
      },
    });
  } catch (error) {
    console.error("Error en obtenerHistorialConsultorioAdmin:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener historial del consultorio",
    });
  }
};

module.exports = {
  listarConsultoriosAdmin,
  crearConsultorioAdmin,
  actualizarConsultorioAdmin,
  eliminarConsultorioAdmin,
  cambiarMantenimientoConsultorioAdmin,
  cambiarEstadoConsultorioAdmin,
  obtenerHistorialConsultorioAdmin,
};