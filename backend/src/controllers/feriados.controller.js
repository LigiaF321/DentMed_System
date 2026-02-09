// controllers/feriados.controller.js

const getFeriados = async (req, res) => {
  try {
    const feriados = [
      { fecha: "2026-01-01", motivo: "Año Nuevo" },
      { fecha: "2026-04-14", motivo: "Semana Santa" }
    ];

    res.status(200).json({
      success: true,
      message: "Feriados obtenidos correctamente",
      data: feriados
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener feriados"
    });
  }
};

module.exports = {
  getFeriados
};
