const { pgPool } = require('./conexiones');

async function migrarItems(mysqlConn) {
  const [rows] = await mysqlConn.query(`
    SELECT i.iditemfactura, i.productoid, i.facturaid, i.cantidad, i.total,
           p.Descripcion AS descripcion_producto
    FROM itemfactura i
    INNER JOIN factura f ON f.idfactura = i.facturaid
    LEFT JOIN producto p ON p.idProducto = i.productoid
    WHERE i.cantidad IS NOT NULL AND i.cantidad != 0
      AND i.total IS NOT NULL AND i.total != 0
    ORDER BY i.iditemfactura
  `);

  console.log(`Migrando ${rows.length} items de factura...`);

  let contador = 0;

  for (const row of rows) {
    const precioUnitario = row.total / row.cantidad;
    const descripcion = row.descripcion_producto || 'Producto eliminado';

    await pgPool.query(
      `INSERT INTO factura_items (factura_id, producto_id, descripcion, precio_unitario, cantidad, total)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [row.facturaid, row.productoid, descripcion, precioUnitario, row.cantidad, row.total]
    );

    contador++;
    if (contador % 5000 === 0) {
      console.log(`  ${contador} items migrados...`);
    }
  }

  console.log('Items migrados.');
}

module.exports = { migrarItems };