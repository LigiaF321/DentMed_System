const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Paciente = sequelize.define(
  "Paciente",
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
    telefono: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    alergias: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Alergias separadas por comas",
    },
  },
  {
    tableName: "pacientes",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Paciente;
