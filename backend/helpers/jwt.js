const jwt = require('jsonwebtoken');

const generarJWT = (uid, usuario, rol) => {
  return new Promise((resolve, reject) => {
    const payload = { uid, usuario, rol };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' }, (err, token) => {
      if (err) {
        console.log(err);
        reject('No se pudo generar el token');
      }
      resolve(token);
    });
  });
};

module.exports = { generarJWT };