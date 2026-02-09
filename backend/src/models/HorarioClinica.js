const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HorarioClinica = sequelize.define(
  "HorarioClinica",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    dia_semana: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "Lunes, Martes, Miércoles, Jueves, Viernes, Sábado",
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
  },
  {
    tableName: "horarios_clinica",
    timestamps: true,
    underscored: true,
  }
);

module.exports = HorarioClinica;
