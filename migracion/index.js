const { getMysqlConnection, pgPool } = require('./conexiones');
const { limpiarBaseDestino } = require('./migrar-limpieza');
const { migrarMesas } = require('./migrar-mesas');
const { migrarSaloneros } = require('./migrar-saloneros');
const { migrarProductos } = require('./migrar-productos');
const { migrarTrucha } = require('./migrar-trucha');
const { migrarFacturas } = require('./migrar-facturas');
const { migrarItems } = require('./migrar-items');
const { migrarDivisiones } = require('./migrar-divisiones');

async function main() {
  const mysqlConn = await getMysqlConnection();

  try {
    await limpiarBaseDestino();

    await migrarMesas(mysqlConn);
    await migrarSaloneros(mysqlConn);
    await migrarProductos(mysqlConn);
    await migrarTrucha(mysqlConn);
    await migrarFacturas(mysqlConn);
    await migrarItems(mysqlConn);
    await migrarDivisiones(mysqlConn);

    console.log('Migración completada con éxito.');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await mysqlConn.end();
    await pgPool.end();
  }
}

main();