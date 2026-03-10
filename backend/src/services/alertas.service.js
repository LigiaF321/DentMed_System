const { Material, AlertaInventario } = require("../models");

async function calcularAlertas() {

  const materiales = await Material.findAll();

  for (const material of materiales) {

    let nivel = null;

    if (material.stock_actual < material.stock_minimo) {

      nivel = "critico";

    } else if (material.stock_actual <= material.stock_minimo * 1.2) {

      nivel = "preventivo";

    }

    const alerta = await AlertaInventario.findOne({
      where: { insumo_id: material.id, activa: true }
    });

    if (nivel) {

      if (!alerta) {

        await AlertaInventario.create({
          insumo_id: material.id,
          stock_actual: material.stock_actual,
          stock_minimo: material.stock_minimo,
          nivel
        });

      } else {

        await alerta.update({
          stock_actual: material.stock_actual,
          nivel
        });

      }

    } else {

      if (alerta) {

        await alerta.update({
          activa: false,
          fecha_tratada: new Date()
        });

      }

    }

  }

}

module.exports = {
  calcularAlertas
};