const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DocumentoPaciente = sequelize.define(
  "DocumentoPaciente",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_paciente: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_usuario_subio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre_original: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre_archivo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ruta_archivo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    extension: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tamano_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tipo_documento: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "otro",
    },
    etiquetas: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "[]",
    },
    miniatura_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "documentos_paciente",
    timestamps: true,
    underscored: true,
  }
);

module.exports = DocumentoPaciente;