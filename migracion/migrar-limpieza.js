const { pgPool } = require('./conexiones');

async function limpiarBaseDestino() {
  console.log('Limpiando base de datos destino...');

  // TRUNCATE con CASCADE respeta las FKs sin necesidad de ordenar manualmente,
  // y RESTART IDENTITY reinicia los contadores SERIAL a 1.
  await pgPool.query(`
    TRUNCATE TABLE
      cierres_caja,
      factura_divisiones,
      factura_items,
      facturas,
      trucha_cruda_precio,
      producto_historico_precio,
      productos,
      saloneros,
      mesas,
      usuarios
    RESTART IDENTITY CASCADE
  `);

  console.log('Base de datos destino limpia.');
}

module.exports = { limpiarBaseDestino };