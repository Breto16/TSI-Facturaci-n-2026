const { pgPool } = require('./conexiones');

const MAPA_ESTADOS = {
  1: 'abierta',
  2: 'pagada',
  3: 'anulada',
  4: 'anulada',
  5: 'dividida',
  6: 'impresa',
};

async function construirMapaTipoPago(mysqlConn) {
  const [rows] = await mysqlConn.query('SELECT idtipopago, detalle FROM tipopago');

  const mapa = {};
  for (const row of rows) {
    const texto = (row.detalle || '').toLowerCase();
    if (texto.includes('efec')) {
      mapa[row.idtipopago] = 'efectivo';
    } else if (texto.includes('tarj')) {
      mapa[row.idtipopago] = 'tarjeta';
    } else {
      mapa[row.idtipopago] = null;
    }
  }

  return mapa;
}

async function migrarFacturas(mysqlConn) {
  const mapaTipoPago = await construirMapaTipoPago(mysqlConn);

  const [rows] = await mysqlConn.query('SELECT * FROM factura ORDER BY idfactura');

  console.log(`Migrando ${rows.length} facturas...`);

  let contador = 0;

  for (const row of rows) {
    const estado = MAPA_ESTADOS[row.estado] || 'anulada';
    const tipoPago = row.tipopago != null ? mapaTipoPago[row.tipopago] || null : null;

    const tieneTrucha = (row.pendienteTrucha != null && Number(row.pendienteTrucha) !== 0)
      || (row.totaltrucha != null && Number(row.totaltrucha) > 0);

    const precioTruchaCruda = row.precioTruchaCruda != null
      ? parseFloat(row.precioTruchaCruda) || null
      : null;

    await pgPool.query(
      `INSERT INTO facturas (
        id, mesa_id, salonero_id, detalle, estado,
        subtotal, descuento, servicio, total,
        tiene_trucha, trucha_gramos, trucha_precio_gramo, trucha_total,
        tipo_pago, fecha_apertura, fecha_cierre
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15, $16
      )`,
      [
        row.idfactura,
        row.idmesa,
        row.saloneroid,
        row.detalle,
        estado,
        row.subtotal || 0,
        row.descuento || 0,
        row.servicio || 0,
        row.total || 0,
        tieneTrucha,
        row.gramostrucha,
        precioTruchaCruda,
        row.totaltrucha,
        tipoPago,
        row.fechaapertura,
        row.fechacierre,
      ]
    );

    contador++;
    if (contador % 2000 === 0) {
      console.log(`  ${contador} facturas migradas...`);
    }
  }

  await pgPool.query(`SELECT setval('facturas_id_seq', (SELECT MAX(id) FROM facturas))`);

  console.log('Facturas migradas.');
}

module.exports = { migrarFacturas };