// migracion/fusionar-prioridades.js
const { Pool } = require('pg')
const { pgPool: finalPool } = require('./conexiones')
require('dotenv').config()

const laptopPool = new Pool({
  host: process.env.PG_LAPTOP_HOST,
  port: Number(process.env.PG_LAPTOP_PORT),
  user: process.env.PG_LAPTOP_USER,
  password: process.env.PG_LAPTOP_PASSWORD,
  database: process.env.PG_LAPTOP_DATABASE,
})

async function fusionarProductos() {
  const { rows: productosLaptop } = await laptopPool.query(
    'SELECT id, codigo, descripcion, precio, disponible, prioridad FROM productos ORDER BY id'
  )

  console.log(`Revisando ${productosLaptop.length} productos de la laptop...`)

  let actualizados = 0
  let insertados = 0

  for (const p of productosLaptop) {
    const { rows: existente } = await finalPool.query(
      'SELECT id FROM productos WHERE id = $1', [p.id]
    )

    if (existente.length > 0) {
      // Producto ya migrado desde MySQL: solo se trae la prioridad ajustada en la laptop
      if (p.prioridad && p.prioridad !== 0) {
        await finalPool.query(
          'UPDATE productos SET prioridad = $1 WHERE id = $2',
          [p.prioridad, p.id]
        )
        actualizados++
      }
    } else {
      // Producto nuevo, creado solo en la laptop durante las pruebas
      await finalPool.query(
        `INSERT INTO productos (id, codigo, descripcion, precio, disponible, prioridad, categoria)
         VALUES ($1, $2, $3, $4, $5, $6, 'salon')`,
        [p.id, p.codigo, p.descripcion, p.precio, p.disponible, p.prioridad || 0]
      )
      insertados++
    }
  }

  await finalPool.query(`SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos))`)

  console.log(`Prioridades actualizadas: ${actualizados}`)
  console.log(`Productos nuevos insertados: ${insertados}`)
}

async function main() {
  try {
    await fusionarProductos()
    console.log('Fusión completada con éxito.')
  } catch (error) {
    console.error('Error durante la fusión:', error)
  } finally {
    await laptopPool.end()
    await finalPool.end()
  }
}

main()