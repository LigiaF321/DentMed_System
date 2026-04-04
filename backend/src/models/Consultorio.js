const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Consultorio = sequelize.define(
  "Consultorio",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El nombre del consultorio es obligatorio",
        },
      },
    },
    capacidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: [1],
          msg: "La capacidad mínima es 1",
        },
      },
    },
    equipamiento_json: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "[]",
      get() {
        const rawValue = this.getDataValue("equipamiento_json");
        try {
          return rawValue ? JSON.parse(rawValue) : [];
        } catch (error) {
          return [];
        }
      },
      set(value) {
        this.setDataValue(
          "equipamiento_json",
          JSON.stringify(Array.isArray(value) ? value : [])
        );
      },
    },
    estado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "disponible",
      validate: {
        isIn: {
          args: [["disponible", "mantenimiento", "limpieza"]],
          msg: "Estado de consultorio no válido",
        },
      },
    },
  },
  {
    tableName: "consultorios",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Consultorio;