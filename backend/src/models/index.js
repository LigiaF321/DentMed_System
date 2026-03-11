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

// Alertas
const AlertaInventario = require("./AlertaInventario");
const ConfiguracionAlerta = require("./ConfiguracionAlerta");
const HistorialNotificacion = require("./HistorialNotificacion");

// Kardex
const MovimientoInventario = require("./MovimientoInventario");
const MovimientoEliminado = require("./MovimientoEliminado");

// Usuario 1:1 Dentista
Usuario.hasOne(Dentista, { foreignKey: "id_usuario" });
Dentista.belongsTo(Usuario, { foreignKey: "id_usuario" });

// Usuario -> Auditoria, TokenRecuperacion
Usuario.hasMany(Auditoria, { foreignKey: "id_usuario" });
Auditoria.belongsTo(Usuario, { foreignKey: "id_usuario" });

Usuario.hasMany(TokenRecuperacion, { foreignKey: "id_usuario" });
TokenRecuperacion.belongsTo(Usuario, { foreignKey: "id_usuario" });

// Configuracion -> HistorialConfiguracion
Configuracion.hasMany(HistorialConfiguracion, {
  foreignKey: "clave",
  sourceKey: "clave",
});
HistorialConfiguracion.belongsTo(Configuracion, {
  foreignKey: "clave",
  targetKey: "clave",
});

// Paciente -> Citas
Paciente.hasMany(Cita, { foreignKey: "id_paciente" });
Cita.belongsTo(Paciente, { foreignKey: "id_paciente" });

// Dentista -> Citas
Dentista.hasMany(Cita, { foreignKey: "id_dentista" });
Cita.belongsTo(Dentista, { foreignKey: "id_dentista" });

// Consultorio -> Citas
Consultorio.hasMany(Cita, { foreignKey: "id_consultorio" });
Cita.belongsTo(Consultorio, { foreignKey: "id_consultorio" });

// Alertas de inventario
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

// Kardex / movimientos
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
  AlertaInventario,
  ConfiguracionAlerta,
  HistorialNotificacion,
  MovimientoInventario,
  MovimientoEliminado,
};