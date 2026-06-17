const bcrypt = require('bcryptjs');
const pool = require('./db/connection');

async function crearAdmin() {
  const nombre = 'Administrador';
  const usuario = 'admin';
  const password = 'admin';

  const salt = bcrypt.genSaltSync();
  const passwordHash = bcrypt.hashSync(password, salt);

  await pool.query(
    `INSERT INTO usuarios (nombre, usuario, password_hash, rol)
     VALUES ($1, $2, $3, 'admin')`,
    [nombre, usuario, passwordHash]
  );

  console.log('Usuario admin creado.');
  console.log('Usuario: admin');
  console.log('Password: admin');

  await pool.end();
}

crearAdmin().catch(console.error);