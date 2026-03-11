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

    codigo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },

    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    categoria: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    proveedor_principal: {
      type: DataTypes.STRING(200),
      allowNull: true,
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
      comment: "Stock actual del insumo",
    },

    ultima_entrada: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    ultima_salida: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    costo_promedio: {
      type: DataTypes.DECIMAL(10, 2),
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