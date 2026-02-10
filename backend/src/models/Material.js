const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Material = sequelize.define(
  "Material",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    stock_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Para alertas de inventario bajo",
    },
    unidad_medida: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "piezas, ml, gramos, etc.",
    },
    cantidad_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "materiales",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Material;
