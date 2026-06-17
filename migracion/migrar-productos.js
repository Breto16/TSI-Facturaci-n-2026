const { pgPool } = require('./conexiones');

async function migrarProductos(mysqlConn) {
  const [rows] = await mysqlConn.query(
    'SELECT idProducto, Codigo, Descripcion, Precio, Disponible FROM producto ORDER BY idProducto'
  );

  console.log(`Migrando ${rows.length} productos...`);

  for (const row of rows) {
    const precio = parseFloat(row.Precio) || 0;

    await pgPool.query(
      `INSERT INTO productos (id, codigo, descripcion, precio, disponible, prioridad, categoria)
       VALUES ($1, $2, $3, $4, $5, 0, 'salon')`,
      [row.idProducto, row.Codigo, row.Descripcion, precio, !!row.Disponible]
    );
  }

  await pgPool.query(`SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos))`);

  console.log('Productos migrados.');
}

module.exports = { migrarProductos };