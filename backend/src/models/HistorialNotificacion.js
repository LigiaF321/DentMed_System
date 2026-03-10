const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HistorialNotificacion = sequelize.define(
  "HistorialNotificacion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    fecha_envio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    destinatarios: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    total_alertas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    criticas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    preventivas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    resultado: {
      type: DataTypes.ENUM("exitoso", "fallido"),
      allowNull: false,
    },
  },
  {
    tableName: "historial_notificaciones",
    timestamps: true,
    underscored: true,
  }
);

module.exports = HistorialNotificacion;