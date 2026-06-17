const { pgPool } = require('./conexiones');

async function migrarDivisiones(mysqlConn) {
  const [rows] = await mysqlConn.query(
    'SELECT idfacturapadre, idfacturahija FROM facturadividida ORDER BY idfacturadividida'
  );

  console.log(`Migrando ${rows.length} divisiones de factura...`);

  for (const row of rows) {
    await pgPool.query(
      'INSERT INTO factura_divisiones (factura_padre_id, factura_hija_id) VALUES ($1, $2)',
      [row.idfacturapadre, row.idfacturahija]
    );
  }

  console.log('Divisiones migradas.');
}

module.exports = { migrarDivisiones };