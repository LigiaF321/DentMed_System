const { Tratamiento, Paciente, Dentista } = require("../models");

/**
 * Lista todos los tratamientos con filtros opcionales
 */
const listarTodos = async (req, res) => {
  try {
    const { tipo, doctor, fechaInicio, fechaFin, page = 1, limit = 100 } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (doctor) where.doctorId = doctor;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha["$gte"] = fechaInicio;
      if (fechaFin) where.fecha["$lte"] = fechaFin;
    }
    const tratamientos = await Tratamiento.findAndCountAll({
      where,
      include: [
        { model: Paciente, attributes: ["id", "nombre"] },
        { model: Dentista, attributes: ["id", "nombre", "apellidos"] },
      ],
      order: [["fecha", "DESC"]],
      offset: (page - 1) * limit,
      limit: parseInt(limit),
    });
    return res.json({
      total: tratamientos.count,
      tratamientos: tratamientos.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener tratamientos" });
  }
}

/**
 * Guarda un nuevo tratamiento
 * Ignora el doctorId del body y usa el del usuario autenticado
 */
const guardarTratamiento = async (req, res) => {
  try {
    const { pacienteId, tipo, fecha, diente, costo, descripcion, diagnostico, observaciones, materiales } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "No hay usuario autenticado" });
    }

    const dentista = await Dentista.findOne({ where: { id_usuario: req.user.id } });
    if (!dentista) {
      console.error(`Usuario ${req.user.id} no tiene dentista asociado`);
      return res.status(403).json({ error: "El usuario no está registrado como dentista" });
    }

    const doctorIdCorrecto = dentista.id;

    const nuevoTratamiento = await Tratamiento.create({
      pacienteId,
      tipo,
      fecha: fecha || new Date(),
      diente: diente || null,
      doctorId: doctorIdCorrecto,
      costo: costo || 0,
      descripcion: descripcion || null,
      diagnostico: diagnostico || null,
      observaciones: observaciones || null,
      materiales: materiales || []
    });

    console.log(`✅ Tratamiento guardado - Doctor ID: ${doctorIdCorrecto} (usuario: ${req.user.id})`);

    return res.status(201).json({
      message: "Tratamiento guardado exitosamente",
      tratamiento: nuevoTratamiento
    });
  } catch (error) {
    console.error("Error al guardar tratamiento:", error);
    return res.status(500).json({ error: "Error interno al guardar el tratamiento", detalle: error.message });
  }
};

/**
 * Obtiene tratamientos específicos de un paciente
 * ── CAMBIO: usar req.params.id en lugar de req.params.pacienteId ──
 */
const listarTratamientosPaciente = async (req, res) => {
  try {
    const pacienteId = req.params.id || req.params.pacienteId;
    const { tipo, fechaInicio, fechaFin, page = 1, limit = 50 } = req.query;
    const where = { pacienteId };
    if (tipo) where.tipo = tipo;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha["$gte"] = fechaInicio;
      if (fechaFin) where.fecha["$lte"] = fechaFin;
    }
    const tratamientos = await Tratamiento.findAndCountAll({
      where,
      include: [
        { model: Paciente, attributes: ["id", "nombre"] },
        { model: Dentista, attributes: ["id", "nombre", "apellidos"] },
      ],
      order: [["fecha", "DESC"]],
      offset: (page - 1) * limit,
      limit: parseInt(limit),
    });
    return res.json({
      total: tratamientos.count,
      tratamientos: tratamientos.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener tratamientos del paciente" });
  }
};

/**
 * Obtiene la información detallada de un tratamiento único
 */
const obtenerDetalleTratamiento = async (req, res) => {
  try {
    const { id } = req.params;
    const tratamiento = await Tratamiento.findOne({
      where: { id },
      include: [
        { model: Paciente, attributes: ["id", "nombre"] },
        { model: Dentista, attributes: ["id", "nombre", "apellidos"] },
      ],
    });
    if (!tratamiento) {
      return res.status(404).json({ error: "Tratamiento no encontrado" });
    }
    return res.json(tratamiento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener detalle del tratamiento" });
  }
};

/**
 * Genera la exportación del historial clínico en PDF
 */
const exportarHistorialPDF = async (req, res) => {
  try {
    const { id_paciente } = req.params;
    const generarPDFHistorial = require('../utils/generarPDFHistorial');
    await generarPDFHistorial(res, id_paciente);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al generar PDF" });
  }
};

/**
 * Obtiene todas las sesiones asociadas a un tratamiento
 */
const obtenerSesionesTratamiento = async (req, res) => {
  try {
    const { id } = req.params;
    const sesiones = await Tratamiento.findAll({
      where: { id },
      include: [
        { model: Paciente, attributes: ["id", "nombre"] },
        { model: Dentista, attributes: ["id", "nombre", "apellidos"] },
      ],
      order: [["fecha", "ASC"]],
    });
    if (!sesiones || sesiones.length === 0) {
      return res.status(404).json({ error: "No se encontraron sesiones" });
    }
    return res.json({ sesiones });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener sesiones" });
  }
};

/**
 * Actualiza el estado de un tratamiento
 * ── CAMBIO: también actualiza observaciones y motivo_cancelacion ──
 */
const actualizarTratamiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones, motivo_cancelacion } = req.body;

    const tratamiento = await Tratamiento.findByPk(id);
    if (!tratamiento) {
      return res.status(404).json({ error: "Tratamiento no encontrado" });
    }

    const updates = {};
    if (estado             !== undefined) updates.estado             = estado;
    if (observaciones      !== undefined) updates.observaciones      = observaciones;
    if (motivo_cancelacion !== undefined) updates.motivo_cancelacion = motivo_cancelacion;

    await tratamiento.update(updates);

    return res.json({ message: "Tratamiento actualizado correctamente", tratamiento });
  } catch (error) {
    console.error("Error al actualizar tratamiento:", error);
    return res.status(500).json({ error: "Error interno al actualizar el tratamiento", detalle: error.message });
  }
};

module.exports = {
  listarTodos,
  guardarTratamiento,
  listarTratamientosPaciente,
  obtenerDetalleTratamiento,
  exportarHistorialPDF,
  obtenerSesionesTratamiento,
  actualizarTratamiento,
};