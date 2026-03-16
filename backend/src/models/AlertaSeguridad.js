const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AlertaSeguridad = sequelize.define("AlertaSeguridad", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tipo_alerta: { type: DataTypes.ENUM('intentos_fallidos', 'acceso_fuera_horario', 'cuenta_bloqueada', 'ip_sospechosa', 'cambio_clave_inusual', 'nuevo_dispositivo'), allowNull: false },
  prioridad: { type: DataTypes.ENUM('critica', 'advertencia', 'informativa'), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  ip_origen: { type: DataTypes.STRING(45), allowNull: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: true },
  usuario_nombre: { type: DataTypes.STRING(100), allowNull: true },
  metadatos: { type: DataTypes.JSON, allowNull: true },
  fecha_alerta: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('activa', 'silenciada', 'revisada', 'resuelta'), allowNull: false, defaultValue: 'activa' },
  silenciada_hasta: { type: DataTypes.DATE, allowNull: true },
  silenciada_por: { type: DataTypes.INTEGER, allowNull: true },
  justificacion_silencio: { type: DataTypes.TEXT, allowNull: true },
  revisada_por: { type: DataTypes.INTEGER, allowNull: true },
  fecha_revision: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "alertas_seguridad", timestamps: false });

AlertaSeguridad.associate = (models) => {
  AlertaSeguridad.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
  AlertaSeguridad.belongsTo(models.Usuario, { foreignKey: 'silenciada_por', as: 'silenciador' });
  AlertaSeguridad.belongsTo(models.Usuario, { foreignKey: 'revisada_por', as: 'revisor' });
};

module.exports = AlertaSeguridad;