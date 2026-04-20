// backend/src/controllers/adminPerfil.controller.js
const bcrypt      = require('bcryptjs');
const path        = require('path');
const { Usuario } = require('../models');

// ── Función auxiliar para obtener el admin ────────────────────────────────────
const getAdmin = async (req) => {
  // Si el token tiene id válido, buscar por id
  if (req.user?.id && req.user.id !== 0) {
    const u = await Usuario.findByPk(req.user.id);
    if (u) return u;
  }
  // Fallback: buscar por rol admin (para el admin master)
  return await Usuario.findOne({ where: { rol: 'admin' } });
};

// ── GET /api/admin/perfil ─────────────────────────────────────────────────────
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await getAdmin(req);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({
      id:       usuario.id,
      nombre:   usuario.username || usuario.email?.split('@')[0] || 'Admin',
      correo:   usuario.email,
      telefono: usuario.telefono || '',
      rol:      usuario.rol,
      foto_url: usuario.foto_url || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

// ── PUT /api/admin/perfil ─────────────────────────────────────────────────────
const editarPerfil = async (req, res) => {
  try {
    const { nombre, correo, telefono } = req.body;
    const usuario = await getAdmin(req);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    const updates = {};
    if (nombre   !== undefined) updates.username = nombre;
    if (correo   !== undefined) updates.email    = correo;
    if (telefono !== undefined) updates.telefono = telefono;

    await usuario.update(updates);
    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

// ── PUT /api/admin/cambiar-password ──────────────────────────────────────────
const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva)
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    if (passwordNueva.length < 6)
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });

    const usuario = await getAdmin(req);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    const valida = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!valida) return res.status(400).json({ message: 'La contraseña actual es incorrecta' });

    const hash = await bcrypt.hash(passwordNueva, 10);
    await usuario.update({ password_hash: hash });
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
};

// ── PUT /api/admin/foto ───────────────────────────────────────────────────────
const subirFoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió ninguna imagen' });
    const usuario = await getAdmin(req);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    const fotoUrl = `/uploads/fotos/${req.file.filename}`;
    await usuario.update({ foto_url: fotoUrl });
    res.json({ message: 'Foto actualizada correctamente', url: fotoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al subir foto' });
  }
};

// ── DELETE /api/admin/foto ────────────────────────────────────────────────────
const eliminarFoto = async (req, res) => {
  try {
    const usuario = await getAdmin(req);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    await usuario.update({ foto_url: null });
    res.json({ message: 'Foto eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar foto' });
  }
};

module.exports = { obtenerPerfil, editarPerfil, cambiarPassword, subirFoto, eliminarFoto };