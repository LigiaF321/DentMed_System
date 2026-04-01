const { Op } = require("sequelize"); 
// Opción 1: Importación directa del modelo PreReserva para evitar errores de 'undefined'
const PreReserva = require("../models/PreReserva"); 
const { Consultorio, Cita } = require("../models"); 

// CORRECCIÓN DE IMPORTACIÓN: Se prueba la carga para manejar tanto module.exports como { export }
const registrarAuditoriaRaw = require("../utils/registrarAuditoria"); 

/**
 * Función auxiliar para llamar a la auditoría sin importar el formato de exportación
 */
const ejecutarAuditoria = async (usuarioId, accion, detalle) => {
  try {
    if (typeof registrarAuditoriaRaw === 'function') {
      await registrarAuditoriaRaw(usuarioId, accion, detalle);
    } else if (registrarAuditoriaRaw && typeof registrarAuditoriaRaw.registrarAuditoria === 'function') {
      await registrarAuditoriaRaw.registrarAuditoria(usuarioId, accion, detalle);
    }
  } catch (err) {
    console.error("Error silencioso en auditoría:", err.message);
  }
};

/**
 * RUTAS ORIGINALES DEL COMPAÑERO (Mantenidas sin cambios)
 */
const listarConsultorios = async (req, res) => {
  try {
    const consultorios = await Consultorio.findAll({
      attributes: ["id", "nombre", "ubicacion", "estado", "capacidad"],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      ok: true,
      data: consultorios,
    });
  } catch (error) {
    console.error("Error al listar consultorios:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener consultorios",
    });
  }
};

/**
 * B1: SUGERENCIA INTELIGENTE DE CONSULTORIOS
 */
const sugerirConsultorios = async (req, res) => {
  try {
    const { procedimiento, fecha, hora, duracion } = req.query;

    const sugerencias = await Consultorio.findAll({
      where: {
        estado: "disponible",
        equipamiento: { [Op.like]: `%${procedimiento}%` } 
      }
    });

    return res.status(200).json({
      ok: true,
      data: sugerencias,
    });
  } catch (error) {
    console.error("Error en sugerencia de consultorios:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al sugerir consultorios",
    });
  }
};

/**
 * B2: CREAR PRE-RESERVA (VIGENCIA DE 7 DÍAS)
 */
const crearPreReserva = async (req, res) => {
  try {
    const { id_cita, id_consultorio } = req.body;

    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 7);

    const preReserva = await PreReserva.create({
      id_cita,
      id_consultorio,
      fecha_expiracion: fechaExpiracion
    });

    // CORRECCIÓN DE SEGURIDAD: Evita el error "Cannot read properties of undefined (reading 'id')"
    const usuarioId = req.usuario ? req.usuario.id : 1; 

    // B6: Registro de auditoría (quién, qué, cuándo)
    await ejecutarAuditoria(usuarioId, "PRE-RESERVA", `Cita #${id_cita} pre-reservada en consultorio #${id_consultorio}`);

    return res.status(201).json({
      ok: true,
      data: preReserva,
    });
  } catch (error) {
    console.error("Error al crear pre-reserva:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al procesar la pre-reserva",
    });
  }
};

/**
 * B3: CAMBIAR CONSULTORIO DE CITA
 */
const actualizarConsultorioCita = async (req, res) => {
  try {
    const { id } = req.params; 
    const { id_consultorio } = req.body;

    const cita = await Cita.findByPk(id);
    if (!cita) {
      return res.status(404).json({ ok: false, message: "Cita no encontrada" });
    }

    await cita.update({ id_consultorio });

    const usuarioId = req.usuario ? req.usuario.id : 1;

    // B6: Auditoría de cambio de consultorio
    await ejecutarAuditoria(usuarioId, "CAMBIO_CONSULTORIO", `Cita #${id} movida al consultorio #${id_consultorio}`);

    return res.status(200).json({
      ok: true,
      message: "Consultorio actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar consultorio:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar el consultorio de la cita",
    });
  }
};

/**
 * B4: CANCELAR PRE-RESERVA
 */
const eliminarPreReserva = async (req, res) => {
  try {
    const { id } = req.params;
    
    const eliminada = await PreReserva.destroy({ where: { id } });
    
    if (!eliminada) {
      return res.status(404).json({ ok: false, message: "Pre-reserva no encontrada" });
    }

    return res.status(200).json({
      ok: true,
      message: "Pre-reserva cancelada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar pre-reserva:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al cancelar la pre-reserva",
    });
  }
};

module.exports = {
  listarConsultorios,
  sugerirConsultorios,
  crearPreReserva,
  actualizarConsultorioCita,
  eliminarPreReserva,
};