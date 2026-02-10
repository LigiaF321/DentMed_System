const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Cita = sequelize.define(
  "Cita",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_paciente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "pacientes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    id_dentista: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "dentistas", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    id_consultorio: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "consultorios", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Programada",
      comment: "Programada | Confirmada | Cancelada | Completada",
    },
    motivo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    duracion_estimada: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Minutos",
    },
  },
  {
    tableName: "citas",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Cita;
