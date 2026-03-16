// Middleware para acceso solo de administradores
module.exports = function soloAdmin(req, res, next) {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  }
  next();
};
