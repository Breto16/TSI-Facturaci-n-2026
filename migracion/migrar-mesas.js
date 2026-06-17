const { pgPool } = require('./conexiones');

async function migrarMesas(mysqlConn) {
  const [rows] = await mysqlConn.query('SELECT idmesas, Nombre FROM mesas ORDER BY idmesas');

  console.log(`Migrando ${rows.length} mesas...`);

  for (const row of rows) {
    await pgPool.query(
      'INSERT INTO mesas (id, nombre, activa) VALUES ($1, $2, true)',
      [row.idmesas, row.Nombre]
    );
  }

  await pgPool.query(`SELECT setval('mesas_id_seq', (SELECT MAX(id) FROM mesas))`);

  console.log('Mesas migradas.');
}

module.exports = { migrarMesas };