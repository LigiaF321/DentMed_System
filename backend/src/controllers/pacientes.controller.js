// controllers/pacientes.controller.js

const getPacientes = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Listado de pacientes',
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener pacientes',
    });
  }
};

module.exports = {
  getPacientes,
};
