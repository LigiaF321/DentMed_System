/**
 * Configuración de conexión a MySQL con Sequelize (XAMPP)
 * Requiere: base de datos dentmed_db creada en phpMyAdmin con collation utf8mb4_unicode_ci
 */
require("dotenv").config();
const { Sequelize } = require("sequelize");

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || 3306;
const dbName = process.env.DB_NAME || "dentmed_db";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD ?? "";

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "mysql",
  timezone: "-06:00",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
