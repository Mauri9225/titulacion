const { verifyToken } = require('../services/auth.service');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = token ? verifyToken(token) : null;

  if (!user) {
    return res.status(401).json({ message: 'Sesion no valida o expirada' });
  }

  req.user = user;
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {

    // Administrador siempre tiene acceso
    if (req.user.role === 'admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos para esta accion' });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
