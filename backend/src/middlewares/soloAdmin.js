// Middleware para acceso solo de administradores
module.exports = function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  }
  next();
};
