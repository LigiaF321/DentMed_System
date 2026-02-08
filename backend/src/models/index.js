/**
 * Índice de modelos - Carga modelos y define asociaciones
 * Orden: primero modelos sin FK, luego los que dependen
 */
const sequelize = require("../config/database");

const Usuario = require("./Usuario");
const Dentista = require("./Dentista");
const Configuracion = require("./Configuracion");
const HorarioClinica = require("./HorarioClinica");
const Auditoria = require("./Auditoria");
const TokenRecuperacion = require("./TokenRecuperacion");
const Paciente = require("./Paciente");
const Consultorio = require("./Consultorio");
const Material = require("./Material");
const Cita = require("./Cita");

// Usuario 1:1 Dentista
Usuario.hasOne(Dentista, { foreignKey: "id_usuario" });
Dentista.belongsTo(Usuario, { foreignKey: "id_usuario" });

// Usuario -> Auditoria, TokenRecuperacion
Usuario.hasMany(Auditoria, { foreignKey: "id_usuario" });
Auditoria.belongsTo(Usuario, { foreignKey: "id_usuario" });
Usuario.hasMany(TokenRecuperacion, { foreignKey: "id_usuario" });
TokenRecuperacion.belongsTo(Usuario, { foreignKey: "id_usuario" });

// Paciente -> Citas
Paciente.hasMany(Cita, { foreignKey: "id_paciente" });
Cita.belongsTo(Paciente, { foreignKey: "id_paciente" });

// Dentista -> Citas
Dentista.hasMany(Cita, { foreignKey: "id_dentista" });
Cita.belongsTo(Dentista, { foreignKey: "id_dentista" });

// Consultorio -> Citas
Consultorio.hasMany(Cita, { foreignKey: "id_consultorio" });
Cita.belongsTo(Consultorio, { foreignKey: "id_consultorio" });

module.exports = {
  sequelize,
  Usuario,
  Dentista,
  Configuracion,
  HorarioClinica,
  Auditoria,
  TokenRecuperacion,
  Paciente,
  Consultorio,
  Material,
  Cita,
};
