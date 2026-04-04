const sequelize = require("../config/database");

const Usuario = require("./Usuario");
const Dentista = require("./Dentista");
const Configuracion = require("./Configuracion");
const HistorialConfiguracion = require("./HistorialConfiguracion");
const HorarioClinica = require("./HorarioClinica");
const Auditoria = require("./Auditoria");
const TokenRecuperacion = require("./TokenRecuperacion");
const Paciente = require("./Paciente");
const Consultorio = require("./Consultorio");
const Material = require("./Material");
const Cita = require("./Cita");
const PreReserva = require("./PreReserva");
const Tratamiento = require("./Tratamiento");
const Bloque = require("./Bloque");
const DocumentoPaciente = require("./DocumentoPaciente");

// Alertas
const AlertaInventario = require("./AlertaInventario");
const ConfiguracionAlerta = require("./ConfiguracionAlerta");
const HistorialNotificacion = require("./HistorialNotificacion");
const AlertaSeguridad = require("./AlertaSeguridad");
const IntentosFallidos = require("./IntentosFallidos");

// Kardex
const MovimientoInventario = require("./MovimientoInventario");
const MovimientoEliminado = require("./MovimientoEliminado");

// ===============================
// USUARIO 1:1 DENTISTA
// ===============================
Usuario.hasOne(Dentista, { foreignKey: "id_usuario" });
Dentista.belongsTo(Usuario, { foreignKey: "id_usuario" });

// ===============================
// USUARIO -> AUDITORIA / TOKEN
// ===============================
Usuario.hasMany(Auditoria, { foreignKey: "id_usuario" });
Auditoria.belongsTo(Usuario, { foreignKey: "id_usuario" });

Usuario.hasMany(TokenRecuperacion, { foreignKey: "id_usuario" });
TokenRecuperacion.belongsTo(Usuario, { foreignKey: "id_usuario" });

// ===============================
// CONFIGURACION -> HISTORIAL
// ===============================
Configuracion.hasMany(HistorialConfiguracion, {
  foreignKey: "clave",
  sourceKey: "clave",
});
HistorialConfiguracion.belongsTo(Configuracion, {
  foreignKey: "clave",
  targetKey: "clave",
});

// ===============================
// PACIENTE / DENTISTA / CONSULTORIO -> CITA
// ===============================
Paciente.hasMany(Cita, { foreignKey: "id_paciente" });
Cita.belongsTo(Paciente, { foreignKey: "id_paciente" });

Dentista.hasMany(Cita, { foreignKey: "id_dentista" });
Cita.belongsTo(Dentista, { foreignKey: "id_dentista" });

Consultorio.hasMany(Cita, { foreignKey: "id_consultorio" });
Cita.belongsTo(Consultorio, { foreignKey: "id_consultorio" });

// ===============================
// CITA / CONSULTORIO -> PRE RESERVA
// ===============================
Cita.hasMany(PreReserva, {
  foreignKey: "id_cita",
  sourceKey: "id",
  as: "preReservas",
});
PreReserva.belongsTo(Cita, {
  foreignKey: "id_cita",
  targetKey: "id",
  as: "cita",
});

Consultorio.hasMany(PreReserva, {
  foreignKey: "id_consultorio",
  sourceKey: "id",
  as: "preReservas",
});
PreReserva.belongsTo(Consultorio, {
  foreignKey: "id_consultorio",
  targetKey: "id",
  as: "consultorio",
});

// ===============================
// PACIENTE / DENTISTA -> TRATAMIENTO
// ===============================
Paciente.hasMany(Tratamiento, { foreignKey: "pacienteId" });
Tratamiento.belongsTo(Paciente, { foreignKey: "pacienteId" });

Dentista.hasMany(Tratamiento, { foreignKey: "doctorId" });
Tratamiento.belongsTo(Dentista, { foreignKey: "doctorId" });

// ===============================
// PACIENTE / USUARIO -> DOCUMENTO PACIENTE
// ===============================
Paciente.hasMany(DocumentoPaciente, {
  foreignKey: "id_paciente",
  sourceKey: "id",
  as: "documentos",
});
DocumentoPaciente.belongsTo(Paciente, {
  foreignKey: "id_paciente",
  targetKey: "id",
  as: "paciente",
});

Usuario.hasMany(DocumentoPaciente, {
  foreignKey: "id_usuario_subio",
  sourceKey: "id",
  as: "documentosSubidos",
});
DocumentoPaciente.belongsTo(Usuario, {
  foreignKey: "id_usuario_subio",
  targetKey: "id",
  as: "usuarioSubio",
});

// ===============================
// DENTISTA -> BLOQUE
// ===============================
Dentista.hasMany(Bloque, { foreignKey: "id_dentista" });
Bloque.belongsTo(Dentista, { foreignKey: "id_dentista" });

// ===============================
// ALERTAS DE INVENTARIO
// ===============================
Material.hasMany(AlertaInventario, {
  foreignKey: "id_insumo",
  sourceKey: "id",
});
AlertaInventario.belongsTo(Material, {
  foreignKey: "id_insumo",
  targetKey: "id",
  as: "insumo",
});

Usuario.hasMany(AlertaInventario, {
  foreignKey: "tratada_por",
  sourceKey: "id",
});
AlertaInventario.belongsTo(Usuario, {
  foreignKey: "tratada_por",
  targetKey: "id",
  as: "usuarioTratante",
});

// ===============================
// ALERTAS DE SEGURIDAD
// ===============================
Usuario.hasMany(AlertaSeguridad, {
  foreignKey: "usuario_id",
  sourceKey: "id",
  as: "alertasSeguridad",
});
AlertaSeguridad.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  targetKey: "id",
  as: "usuario",
});

Usuario.hasMany(AlertaSeguridad, {
  foreignKey: "silenciada_por",
  sourceKey: "id",
  as: "alertasSilenciadas",
});
AlertaSeguridad.belongsTo(Usuario, {
  foreignKey: "silenciada_por",
  targetKey: "id",
  as: "silenciador",
});

Usuario.hasMany(AlertaSeguridad, {
  foreignKey: "revisada_por",
  sourceKey: "id",
  as: "alertasRevisadas",
});
AlertaSeguridad.belongsTo(Usuario, {
  foreignKey: "revisada_por",
  targetKey: "id",
  as: "revisor",
});

// ===============================
// KARDEX / MOVIMIENTOS
// ===============================
Material.hasMany(MovimientoInventario, {
  foreignKey: "id_insumo",
  sourceKey: "id",
  as: "movimientosKardex",
});
MovimientoInventario.belongsTo(Material, {
  foreignKey: "id_insumo",
  targetKey: "id",
  as: "insumo",
});

Usuario.hasMany(MovimientoInventario, {
  foreignKey: "usuario_registra",
  sourceKey: "id",
  as: "movimientosRegistrados",
});
MovimientoInventario.belongsTo(Usuario, {
  foreignKey: "usuario_registra",
  targetKey: "id",
  as: "usuarioRegistra",
});

Dentista.hasMany(MovimientoInventario, {
  foreignKey: "id_doctor",
  sourceKey: "id",
  as: "movimientosComoDoctor",
});
MovimientoInventario.belongsTo(Dentista, {
  foreignKey: "id_doctor",
  targetKey: "id",
  as: "doctorResponsable",
});

Cita.hasMany(MovimientoInventario, {
  foreignKey: "id_cita",
  sourceKey: "id",
  as: "movimientosCita",
});
MovimientoInventario.belongsTo(Cita, {
  foreignKey: "id_cita",
  targetKey: "id",
  as: "citaRelacionada",
});

// ===============================
// MOVIMIENTOS ELIMINADOS
// ===============================
Usuario.hasMany(MovimientoEliminado, {
  foreignKey: "eliminado_por",
  sourceKey: "id",
  as: "movimientosEliminadosUsuario",
});
MovimientoEliminado.belongsTo(Usuario, {
  foreignKey: "eliminado_por",
  targetKey: "id",
  as: "usuarioElimina",
});

MovimientoInventario.hasMany(MovimientoEliminado, {
  foreignKey: "movimiento_id",
  sourceKey: "id",
  as: "historialEliminacion",
});
MovimientoEliminado.belongsTo(MovimientoInventario, {
  foreignKey: "movimiento_id",
  targetKey: "id",
  as: "movimiento",
});

module.exports = {
  sequelize,
  Usuario,
  Dentista,
  Configuracion,
  HistorialConfiguracion,
  HorarioClinica,
  Auditoria,
  TokenRecuperacion,
  Paciente,
  Consultorio,
  Material,
  Cita,
  PreReserva,
  Tratamiento,
  Bloque,
  DocumentoPaciente,
  AlertaInventario,
  ConfiguracionAlerta,
  HistorialNotificacion,
  MovimientoInventario,
  MovimientoEliminado,
  AlertaSeguridad,
  IntentosFallidos,
};