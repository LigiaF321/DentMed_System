const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Configuracion = sequelize.define(
  "Configuracion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clave: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    valor: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "configuracion",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Configuracion;
