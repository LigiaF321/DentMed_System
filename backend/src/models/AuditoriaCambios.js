const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Auditoria = require('./Auditoria');

const AuditoriaCambios = sequelize.define('AuditoriaCambios', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  auditoria_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: Auditoria,
      key: 'id'
    }
  },
  tabla_afectada: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  registro_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  campo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  valor_anterior: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  valor_nuevo: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'auditoria_cambios',
  timestamps: false
});

module.exports = AuditoriaCambios;
