const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // NUEVO CAMPO: Agregado para que coincida con tu ALTER TABLE
    username: {
      type: DataTypes.STRING(100),
      allowNull: true, // Permite nulos si hay registros viejos sin username
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rol: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "dentista",
      comment: "admin | dentista",
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    primer_acceso: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'primer_acceso' // Asegura el mapeo exacto a la columna SQL
    },
  },
  {
    tableName: "usuarios",
    timestamps: true, // Usa created_at y updated_at automáticamente
    underscored: true, // Convierte createdAt de JS a created_at de SQL
  }
);

module.exports = Usuario;