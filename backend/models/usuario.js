const pool = require('../db/connection');

const buscarPorUsuario = async (usuario) => {
  const { rows } = await pool.query(
    'SELECT id, nombre, usuario, password_hash, rol, activo FROM usuarios WHERE usuario = $1',
    [usuario]
  );
  return rows[0];
};

const listar = async () => {
  const { rows } = await pool.query(
    'SELECT id, nombre, usuario, rol, activo, creado_en FROM usuarios ORDER BY id'
  );
  return rows;
};

const crear = async ({ nombre, usuario, passwordHash, rol }) => {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, usuario, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nombre, usuario, rol, activo, creado_en`,
    [nombre, usuario, passwordHash, rol || 'cajero']
  );
  return rows[0];
};

const actualizar = async (id, { nombre, passwordHash, rol, activo }) => {
  const { rows } = await pool.query(
    `UPDATE usuarios SET
      nombre = COALESCE($1, nombre),
      password_hash = COALESCE($2, password_hash),
      rol = COALESCE($3, rol),
      activo = COALESCE($4, activo)
     WHERE id = $5
     RETURNING id, nombre, usuario, rol, activo, creado_en`,
    [nombre, passwordHash, rol, activo, id]
  );
  return rows[0];
};

module.exports = { buscarPorUsuario, listar, crear, actualizar };