/**
 * Datos iniciales para DentMed (seed)
 * Uso: npm run db:seed
 * Ejecutar después de: npm run db:sync
 */
require("dotenv").config({ path: require("path").resolve(process.cwd(), ".env") });
const bcrypt = require("bcryptjs");
const { sequelize, Usuario, Dentista, Configuracion, HorarioClinica, Paciente, Consultorio, Material } = require("../models");

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión OK. Insertando datos iniciales...");

    const passwordHash = await bcrypt.hash("admin123", 10);

    const [adminUser] = await Usuario.findOrCreate({
      where: { email: "admin@dentmed.com" },
      defaults: {
        email: "admin@dentmed.com",
        password_hash: passwordHash,
        rol: "admin",
        activo: true,
      },
    });

    const [dentistaUser] = await Usuario.findOrCreate({
      where: { email: "dentista@dentmed.com" },
      defaults: {
        email: "dentista@dentmed.com",
        password_hash: passwordHash,
        rol: "dentista",
        activo: true,
      },
    });

    await Dentista.findOrCreate({
      where: { id_usuario: adminUser.id },
      defaults: {
        id_usuario: adminUser.id,
        nombre: "Administradora",
        apellidos: "DENTMED",
        especialidad: "General",
        telefono: "99999999",
        email: adminUser.email,
      },
    });

    await Dentista.findOrCreate({
      where: { id_usuario: dentistaUser.id },
      defaults: {
        id_usuario: dentistaUser.id,
        nombre: "Dr. Ejemplo",
        apellidos: "Ortodoncista",
        especialidad: "Ortodoncia",
        telefono: "88888888",
        email: dentistaUser.email,
        licencia: "12345",
      },
    });

    const configKeys = [
      { clave: "stock_minimo_alerta", valor: "5", descripcion: "Umbral para alerta de inventario bajo" },
      { clave: "recordatorio_citas_horas", valor: "24", descripcion: "Horas antes para recordatorio de cita" },
    ];
    for (const c of configKeys) {
      await Configuracion.findOrCreate({ where: { clave: c.clave }, defaults: c });
    }

    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    for (const dia of dias) {
      await HorarioClinica.findOrCreate({
        where: { dia_semana: dia },
        defaults: {
          dia_semana: dia,
          hora_inicio: "08:00:00",
          hora_fin: "12:00:00",
          activo: true,
        },
      });
    }

    await Paciente.findOrCreate({
      where: { telefono: "12345678" },
      defaults: {
        nombre: "Juan Pérez",
        telefono: "12345678",
        email: "juan@email.com",
        direccion: "Tegucigalpa",
        fecha_nacimiento: "1985-05-15",
        alergias: null,
      },
    });

    await Consultorio.findOrCreate({
      where: { nombre: "Consultorio 1" },
      defaults: {
        nombre: "Consultorio 1",
        ubicacion: "Planta baja",
        estado: "Disponible",
        capacidad: 1,
      },
    });

    await Material.findOrCreate({
      where: { nombre: "Guantes latex" },
      defaults: {
        nombre: "Guantes latex",
        stock_minimo: 10,
        unidad_medida: "caja",
        cantidad_actual: 50,
      },
    });

    console.log("✅ Seed completado. Usuario admin: admin@dentmed.com / admin123");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en seed:", err.message);
    process.exit(1);
  }
}

seed();
