const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Configuracion = sequelize.define(
  "Configuracion",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    clave: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    valor: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "configuracion",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

module.exports = Configuracion;