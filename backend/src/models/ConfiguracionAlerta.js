const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ConfiguracionAlerta = sequelize.define(
  "ConfiguracionAlerta",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    notificaciones_activas: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    dia_envio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1, // 1 = Lunes
      validate: {
        min: 1,
        max: 7,
      },
    },

    hora_envio: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: "08:00:00",
    },

    destinatarios_adicionales: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    umbral_preventivo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    tableName: "configuracion_alertas",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ConfiguracionAlerta;