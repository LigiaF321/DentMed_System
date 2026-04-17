// Controlador base para tratamientos (DM22)
const { Tratamiento, Paciente, Dentista } = require("../models");

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
};

module.exports = {
  listarTodos,

  // FUNCIÓN PARA GUARDAR DESDE EL ODONTOGRAMA - CORREGIDA
  guardarTratamiento: async (req, res) => {
    try {
      const { 
        pacienteId, 
        tipo, 
        fecha, 
        diente, 
        doctorId, 
        costo, 
        descripcion, 
        diagnostico, 
        observaciones, 
        materiales 
      } = req.body;

      // 1. Lógica de recuperación de ID de Dentista
      let finalDoctorId = doctorId;

      // Si no viene doctorId en el body, lo buscamos usando el ID de usuario del token
      if (!finalDoctorId && req.user && req.user.id) {
        const dentistaRelacionado = await Dentista.findOne({ 
          where: { id_usuario: req.user.id } 
        });
        
        if (dentistaRelacionado) {
          finalDoctorId = dentistaRelacionado.id;
        }
      }

      // 2. Validación final antes de intentar guardar
      if (!finalDoctorId) {
        return res.status(400).json({ 
          error: "No se pudo identificar un ID de dentista válido para este registro." 
        });
      }

      // 3. Creación del registro
      const nuevoTratamiento = await Tratamiento.create({
        pacienteId,
        tipo,
        fecha: fecha || new Date(),
        diente,
        doctorId: finalDoctorId, // Ya no será null
        costo: costo || 0,
        descripcion,
        diagnostico,
        observaciones,
        materiales: materiales || []
      });

      return res.status(201).json({
        message: "Tratamiento guardado exitosamente",
        tratamiento: nuevoTratamiento
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      return res.status(500).json({ 
        error: "Error interno al guardar el tratamiento",
        detalle: error.message 
      });
    }
  },

  listarTratamientosPaciente: async (req, res) => {
    try {
      const { pacienteId } = req.params;
      const { tipo, fechaInicio, fechaFin, page = 1, limit = 10 } = req.query;
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
      return res.status(500).json({ error: "Error al obtener tratamientos" });
    }
  },

  obtenerDetalleTratamiento: async (req, res) => {
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
  },

  exportarHistorialPDF: async (req, res) => {
    try {
      const { id_paciente } = req.params;
      const generarPDFHistorial = require('../utils/generarPDFHistorial');
      await generarPDFHistorial(res, id_paciente);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al generar PDF" });
    }
  },

  obtenerSesionesTratamiento: async (req, res) => {
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
  },
};