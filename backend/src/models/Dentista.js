const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Dentista = sequelize.define(
  "Dentista",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: "usuarios", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      // Aquí guardaremos el nombre completo (Nombres + Apellidos) para que no falle
    },
    // ELIMINAMOS 'apellidos' porque no existe en tu tabla de MySQL
    numero_licencia: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'numero_licencia' // Nombre exacto que pusiste en el ALTER TABLE
    },
    especialidad: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "dentistas",
    timestamps: true,
    underscored: true, // Esto hace que busque created_at y updated_at
  }
);

module.exports = Dentista;