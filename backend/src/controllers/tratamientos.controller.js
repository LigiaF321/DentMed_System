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
  listarTratamientosPaciente: async (req, res) => {
    try {
      const { pacienteId } = req.params;
      // Filtros y paginación opcionales
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
      // Suponiendo que cada sesión es un Tratamiento con el mismo id de "tratamiento principal" o campo relacionado
      // Si hay una tabla SesionTratamiento, aquí se consultaría. Si no, devolvemos solo el tratamiento principal.
      const sesiones = await Tratamiento.findAll({
        where: { id },
        include: [
          { model: Paciente, attributes: ["id", "nombre"] },
          { model: Dentista, attributes: ["id", "nombre", "apellidos"] },
        ],
        order: [["fecha", "ASC"]],
      });
      if (!sesiones || sesiones.length === 0) {
        return res.status(404).json({ error: "No se encontraron sesiones para este tratamiento" });
      }
      return res.json({ sesiones });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al obtener sesiones del tratamiento" });
    }
  },
};
