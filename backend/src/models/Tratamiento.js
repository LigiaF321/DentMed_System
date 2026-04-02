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
      model: 'Pacientes',
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
  },
  diente: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Dentistas',
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
    type: DataTypes.TEXT, // Se guarda como JSON.stringify(array)
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
  tableName: 'Tratamientos',
  timestamps: false,
});

module.exports = Tratamiento;