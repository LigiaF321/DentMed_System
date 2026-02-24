const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HistorialConfiguracion = sequelize.define(
  "HistorialConfiguracion",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    clave: { type: DataTypes.STRING(100), allowNull: false },

    valor_anterior: { type: DataTypes.INTEGER, allowNull: true },
    valor_nuevo: { type: DataTypes.INTEGER, allowNull: true },

    usuario: { type: DataTypes.STRING(120), allowNull: false },
    ip: { type: DataTypes.STRING(45), allowNull: true },

    fecha_hora: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

    descripcion: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: "historial_configuracion",
    timestamps: false,
    underscored: true,
  }
);

module.exports = HistorialConfiguracion;