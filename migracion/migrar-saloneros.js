const { pgPool } = require('./conexiones');

async function migrarSaloneros(mysqlConn) {
  const [rows] = await mysqlConn.query('SELECT idsalonero, nombre, disponible FROM salonero ORDER BY idsalonero');

  console.log(`Migrando ${rows.length} saloneros...`);

  for (const row of rows) {
    await pgPool.query(
      'INSERT INTO saloneros (id, nombre, disponible) VALUES ($1, $2, $3)',
      [row.idsalonero, row.nombre, !!row.disponible]
    );
  }

  await pgPool.query(`SELECT setval('saloneros_id_seq', (SELECT MAX(id) FROM saloneros))`);

  console.log('Saloneros migrados.');
}

module.exports = { migrarSaloneros };