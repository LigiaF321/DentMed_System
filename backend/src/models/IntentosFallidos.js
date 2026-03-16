const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const IntentosFallidos = sequelize.define("IntentosFallidos", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ip: { type: DataTypes.STRING(45), allowNull: false },
  usuario_intentado: { type: DataTypes.STRING(100), allowNull: false },
  fecha_intento: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  resultado: { type: DataTypes.ENUM('fallido'), allowNull: false, defaultValue: 'fallido' },
}, { tableName: "intentos_fallidos", timestamps: false });

module.exports = IntentosFallidos;