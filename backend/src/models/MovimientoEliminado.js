const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MovimientoEliminado = sequelize.define(
  "MovimientoEliminado",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    movimiento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    datos_movimiento: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
      comment: "Snapshot JSON del movimiento eliminado",
    },

    justificacion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    eliminado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    fecha_eliminacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "movimientos_eliminados",
    timestamps: false,
    underscored: true,
  }
);

module.exports = MovimientoEliminado;