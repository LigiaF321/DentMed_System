const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bloque = sequelize.define('Bloque', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_dentista: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo: {
        type: DataTypes.ENUM('procedimiento largo', 'reunión', 'ausencia', 'personal'),
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: false
    },
    recurrencia: {
        type: DataTypes.ENUM('ninguna', 'diaria', 'semanal', 'mensual'),
        defaultValue: 'ninguna'
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'bloques',
    timestamps: false
});

module.exports = Bloque;