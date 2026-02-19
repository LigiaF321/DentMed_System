const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Dentista = sequelize.define(
  "Dentista",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: "usuarios", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Nombres (p. ej. Juan Carlos). Mantener por compatibilidad.",
    },
    apellidos: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Apellidos (p. ej. Pérez García)",
    },
    licencia: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Número de licencia profesional",
    },
    especialidad: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "dentistas",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Dentista;
