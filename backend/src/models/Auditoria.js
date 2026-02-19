const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Auditoria = sequelize.define(
  "Auditoria",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "usuarios", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    accion: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    modulo: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    detalles: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: "IP desde donde se realizó la acción (IPv4 o IPv6)",
    },
  },
  {
    tableName: "auditoria",
    timestamps: true,
    underscored: true,
    createdAt: "fecha_hora",
    updatedAt: false,
  }
);

module.exports = Auditoria;
