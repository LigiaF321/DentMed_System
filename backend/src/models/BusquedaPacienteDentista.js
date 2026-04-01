// backend/src/models/BusquedaPacienteDentista.js
module.exports = (sequelize, DataTypes) => {
  const BusquedaPacienteDentista = sequelize.define(
    'BusquedaPacienteDentista',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_dentista: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_paciente: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total_busquedas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      ultima_busqueda: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'busquedas_pacientes_dentista',
      timestamps: false,
    }
  );

  return BusquedaPacienteDentista;
};