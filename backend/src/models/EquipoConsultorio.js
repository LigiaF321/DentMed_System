const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EquipoConsultorio = sequelize.define(
  "EquipoConsultorio",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_consultorio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre_equipo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El nombre del equipo es obligatorio",
        },
      },
    },
    estado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "disponible",
      validate: {
        isIn: {
          args: [["disponible", "mantenimiento", "dañado"]],
          msg: "Estado del equipo no válido",
        },
      },
    },
  },
  {
    tableName: "equipos_consultorio",
    timestamps: true,
    underscored: true,
  }
);

module.exports = EquipoConsultorio;