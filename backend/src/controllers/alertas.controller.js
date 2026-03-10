// alertas.controller.js
const { Material } = require("../models");
const { Op } = require("sequelize");

async function getAlertasStock(req, res) {
  try {
    const alertas = await Material.findAll({
      where: {
        cantidad: { [Op.lte]: sequelize.col("stock_minimo") }, // <-- usa la columna correcta
      },
      attributes: ["id", "nombre", "cantidad_actual", "stock_minimo"], // <-- aquí también
      order: [["cantidad_actual", "ASC"]],
    });

    const datos = alertas.map((m) => {
      let nivel = "ok";
      if (m.cantidad <= m.stock_minimo) nivel = "crit";
      else if (m.cantidad <= m.stock_minimo * 1.2) nivel = "warn";

      return {
        id: m.id,
        nombre: m.nombre,
        stock_actual: m.cantidad, // lo mapeas al nombre que tu frontend espera
        stock_minimo: m.stock_minimo,
        nivel,
      };
    });

    return res.json({ alertas: datos });
  } catch (err) {
    console.error("Error obteniendo alertas:", err);
    return res.status(500).json({ message: "No se pudieron cargar las alertas" });
  }
}

module.exports = { getAlertasStock };