const { Op } = require("sequelize");
const { Paciente } = require("../models");

const buscarPacientes = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (q.length < 2) {
      return res.status(200).json({
        ok: true,
        data: [],
      });
    }

    const pacientes = await Paciente.findAll({
      attributes: ["id", "nombre", "telefono", "email"],
      where: {
        [Op.or]: [
          { nombre: { [Op.like]: `%${q}%` } },
          { telefono: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
        ],
      },
      order: [["nombre", "ASC"]],
      limit: 10,
    });

    return res.status(200).json({
      ok: true,
      data: pacientes.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        telefono: p.telefono || "",
        email: p.email || "",
      })),
    });
  } catch (error) {
    console.error("Error al buscar pacientes:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al buscar pacientes",
    });
  }
};

const crearPacienteRapido = async (req, res) => {
  try {
    const { nombre, telefono, email, direccion, fecha_nacimiento } = req.body;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({
        ok: false,
        message: "El nombre del paciente es obligatorio",
      });
    }

    const nuevoPaciente = await Paciente.create({
      nombre: String(nombre).trim(),
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      fecha_nacimiento: fecha_nacimiento || null,
    });

    return res.status(201).json({
      ok: true,
      message: "Paciente creado correctamente",
      data: {
        id: nuevoPaciente.id,
        nombre: nuevoPaciente.nombre,
        telefono: nuevoPaciente.telefono || "",
        email: nuevoPaciente.email || "",
      },
    });
  } catch (error) {
    console.error("Error al crear paciente rápido:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear paciente",
    });
  }
};

module.exports = {
  buscarPacientes,
  crearPacienteRapido,
};