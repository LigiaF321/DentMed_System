const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AlertaInventario = sequelize.define(
  "AlertaInventario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    id_insumo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "FK hacia materiales.id",
    },

    stock_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    stock_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    nivel: {
      type: DataTypes.ENUM("critico", "preventivo", "normal"),
      allowNull: false,
    },

    fecha_alerta: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    fecha_tratada: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    tratada_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "FK hacia usuarios.id",
    },

    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "alertas_inventario",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["id_insumo"] },
      { fields: ["fecha_alerta"] }
    ],
  }
);

module.exports = AlertaInventario;