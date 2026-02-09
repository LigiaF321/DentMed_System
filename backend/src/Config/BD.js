const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  port: 3307, // 👈 IMPORTANTE (el puerto que usa Docker)
  user: "dentmed_user",
  password: "dentmed_pass",
  database: "dentmed_db",
});

module.exports = pool;
