// controllers/horarios.controller.js

// Obtener horarios de atención
const getHorarios = async (req, res) => {
  try {
    // Por ahora devolvemos datos de ejemplo
    const horarios = [
      { dia: 'Lunes', inicio: '08:00', fin: '17:00' },
      { dia: 'Martes', inicio: '08:00', fin: '17:00' },
      { dia: 'Miércoles', inicio: '08:00', fin: '17:00' },
    ];

    res.status(200).json({
      success: true,
      message: 'Horarios de atención obtenidos correctamente',
      data: horarios,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios de atención',
    });
  }
};

module.exports = {
  getHorarios,
};
