const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Consultorio = sequelize.define(
  "Consultorio",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Nombre o número del consultorio",
    },
    ubicacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Disponible",
      comment: "Disponible | Ocupado | Mantenimiento",
    },
    capacidad: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
  },
  {
    tableName: "consultorios",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Consultorio;
