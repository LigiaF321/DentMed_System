// controllers/horarios.controller.js
const db = require("../config/db");


// OBTENER HORARIOS (GET)

const getHorarios = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT dia, hora_inicio AS inicio, hora_fin AS fin FROM horarios"
    );

    res.json({
      success: true,
      message: "Horarios obtenidos correctamente",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al obtener horarios",
    });
  }
};


// GUARDAR / ACTUALIZAR HORARIOS (POST)
const setHorarios = async (req, res) => {
  try {
    const horarios = req.body;

    // 1️⃣ Validar que sea un arreglo
    if (!Array.isArray(horarios) || horarios.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe enviar un arreglo de horarios",
      });
    }

    // 2️⃣ Validar TODOS los horarios primero
    for (const h of horarios) {
      if (!h.dia || !h.inicio || !h.fin) {
        return res.status(400).json({
          success: false,
          message: "Cada horario debe tener dia, inicio y fin",
        });
      }

      if (h.inicio >= h.fin) {
        return res.status(400).json({
          success: false,
          message: `Horario inválido en ${h.dia}`,
        });
      }
    }

    // 3️⃣ Limpiar tabla SOLO si todo está correcto
    await db.query("DELETE FROM horarios");

    // 4️⃣ Insertar nuevos horarios
    for (const h of horarios) {
      await db.query(
        "INSERT INTO horarios (dia, hora_inicio, hora_fin) VALUES (?, ?, ?)",
        [h.dia, h.inicio, h.fin]
      );
    }

    res.json({
      success: true,
      message: "Horarios guardados correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al guardar horarios",
    });
  }
};

module.exports = {
  getHorarios,
  setHorarios,
};
