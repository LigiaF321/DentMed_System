module.exports = (sequelize, DataTypes) => {
  const Alerta = sequelize.define("AlertaInventario", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    insumo: { type: DataTypes.STRING(100), allowNull: false },
    stock_actual: { type: DataTypes.INTEGER, allowNull: false },
    stock_minimo: { type: DataTypes.INTEGER, allowNull: false },
    nivel: { type: DataTypes.ENUM("critico", "preventivo", "normal"), allowNull: false },
    fecha_alerta: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fecha_tratada: { type: DataTypes.DATE, allowNull: true },
    tratada_por: { type: DataTypes.STRING(100), allowNull: true },
    notas: { type: DataTypes.TEXT, allowNull: true },
    activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: "alertas_inventario", timestamps: false });

  return Alerta;
};