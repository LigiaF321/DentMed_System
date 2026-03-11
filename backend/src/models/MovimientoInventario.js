const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MovimientoInventario = sequelize.define(
  "MovimientoInventario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    id_insumo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "FK hacia materiales.id",
    },

    tipo_movimiento: {
      type: DataTypes.ENUM("entrada", "salida", "ajuste"),
      allowNull: false,
    },

    subtipo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "compra, tratamiento, merma, ajuste_fisico, etc.",
    },

    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },

    stock_antes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    stock_despues: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    costo_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    costo_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    fecha_movimiento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    proveedor: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    factura: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    id_cita: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Se relaciona con citas.id cuando aplica",
    },

    id_doctor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "FK hacia dentistas.id",
    },

    motivo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    usuario_registra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "FK hacia usuarios.id",
    },

    eliminado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "movimientos_inventario",
    timestamps: true,
    underscored: true,
    createdAt: "fecha_registro",
    updatedAt: false,
    indexes: [
      { fields: ["id_insumo"] },
      { fields: ["fecha_movimiento"] },
      { fields: ["tipo_movimiento"] },
      { fields: ["eliminado"] },
    ],
  }
);

module.exports = MovimientoInventario;