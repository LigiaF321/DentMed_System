const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Auditoria = sequelize.define('Auditoria', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usuario_nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  usuario_rol: {
    type: DataTypes.ENUM('admin', 'dentista', 'sistema'),
    allowNull: false
  },
  accion: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  modulo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  resultado: {
    type: DataTypes.ENUM('exito', 'fallido', 'bloqueado', 'advertencia'),
    allowNull: false
  },
  ip: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  detalle: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadatos: {
    type: DataTypes.JSON,
    allowNull: true
  },
  session_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'auditoria',
  timestamps: false,
  indexes: [
    { fields: ['fecha_hora'] },
    { fields: ['usuario_id', 'fecha_hora'] },
    { fields: ['accion', 'fecha_hora'] }
  ]
});

module.exports = Auditoria;
