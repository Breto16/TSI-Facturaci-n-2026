const { pgPool } = require('./conexiones');

async function migrarTrucha(mysqlConn) {
  const [rows] = await mysqlConn.query(
    'SELECT preciogramo, fechainicio, fechafin FROM truchacruda ORDER BY idtruchacruda'
  );

  console.log(`Migrando ${rows.length} registros de precio de trucha cruda...`);

  for (const row of rows) {
    await pgPool.query(
      'INSERT INTO trucha_cruda_precio (precio_gramo, fecha_inicio, fecha_fin) VALUES ($1, $2, $3)',
      [row.preciogramo, row.fechainicio, row.fechafin]
    );
  }

  console.log('Precios de trucha cruda migrados.');
}

module.exports = { migrarTrucha };