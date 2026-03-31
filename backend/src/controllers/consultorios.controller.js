const { Consultorio } = require("../models");

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

module.exports = {
  listarConsultorios,
};