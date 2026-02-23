const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HorarioClinica = sequelize.define(
  "HorarioClinica",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    tipo: {
      type: DataTypes.ENUM("semanal", "excepcion"),
      allowNull: false,
      defaultValue: "semanal",
    },

    dia_semana: {
      type: DataTypes.ENUM("Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"),
      allowNull: true,
    },

    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "horarios_clinica",
    timestamps: true,
    underscored: true,
  }
);

module.exports = HorarioClinica;