const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); 

const PreReserva = sequelize.define("PreReserva", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_cita: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "citas", 
      key: "id",
    },
  },
  id_consultorio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "consultorios", 
      key: "id",
    },
  },
  fecha_expiracion: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: "pre_reservas",
  // DESACTIVADO: Así no da error si no tienes esas columnas en MySQL
  timestamps: false, 
});

module.exports = PreReserva;