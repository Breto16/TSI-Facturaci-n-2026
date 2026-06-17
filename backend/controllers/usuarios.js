const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario');
const { generarJWT } = require('../helpers/jwt');

const login = async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const user = await Usuario.buscarPorUsuario(usuario);

    if (!user) {
      return res.status(400).json({ msg: 'Usuario o contraseña incorrectos' });
    }

    if (!user.activo) {
      return res.status(400).json({ msg: 'Usuario deshabilitado' });
    }

    const passwordValida = bcrypt.compareSync(password, user.password_hash);

    if (!passwordValida) {
      return res.status(400).json({ msg: 'Usuario o contraseña incorrectos' });
    }

    const token = await generarJWT(user.id, user.usuario, user.rol);

    res.json({
      uid: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
      token
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.listar();
    res.json(usuarios);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

const postUsuario = async (req, res) => {
  const { nombre, usuario, password, rol } = req.body;

  try {
    const existe = await Usuario.buscarPorUsuario(usuario);

    if (existe) {
      return res.status(400).json({ msg: 'Ese nombre de usuario ya existe' });
    }

    const salt = bcrypt.genSaltSync();
    const passwordHash = bcrypt.hashSync(password, salt);

    const nuevo = await Usuario.crear({ nombre, usuario, passwordHash, rol });
    res.json(nuevo);

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

const putUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, password, rol, activo } = req.body;

  try {
    let passwordHash;
    if (password) {
      const salt = bcrypt.genSaltSync();
      passwordHash = bcrypt.hashSync(password, salt);
    }

    const actualizado = await Usuario.actualizar(id, { nombre, passwordHash, rol, activo });

    if (!actualizado) {
      return res.status(404).json({ msg: 'Usuario no existe' });
    }

    res.json(actualizado);

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

module.exports = { login, getUsuarios, postUsuario, putUsuario };