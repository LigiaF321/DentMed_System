const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tratamiento = sequelize.define('Tratamiento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pacientes', 
      key: 'id',
    },
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Recomendado para evitar nulos de fecha
  },
  diente: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'dentistas', 
      key: 'id',
    },
  },
  costo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  diagnostico: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  materiales: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('materiales');
      try {
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },
    set(val) {
      this.setDataValue('materiales', Array.isArray(val) ? JSON.stringify(val) : val);
    }
  },
}, {
  tableName: 'tratamientos', 
  timestamps: false,
});

module.exports = Tratamiento;