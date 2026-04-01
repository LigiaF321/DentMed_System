const { PreReserva } = require("../models");
const { Op } = require("sequelize");

const limpiarPreReservasExpiradas = async () => {
  try {
    const ahora = new Date();
    const eliminados = await PreReserva.destroy({
      where: {
        fecha_expiracion: { [Op.lt]: ahora } // Borra si la fecha de expiración ya pasó
      }
    });
    if (eliminados > 0) {
      console.log(`🧹 Se eliminaron ${eliminados} pre-reservas expiradas.`);
    }
  } catch (error) {
    console.error("❌ Error al limpiar pre-reservas:", error);
  }
};

module.exports = limpiarPreReservasExpiradas;