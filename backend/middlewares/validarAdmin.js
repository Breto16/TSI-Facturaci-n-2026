const validarAdmin = (req, res, next) => {
  if (req.rol !== 'admin') {
    return res.status(403).json({ msg: 'Se requiere rol de administrador para esta acción' });
  }
  next();
};

module.exports = { validarAdmin };