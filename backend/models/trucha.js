const pool = require('../db/connection')

const obtenerVigente = async () => {
  const { rows } = await pool.query(
    `SELECT id, precio_gramo, fecha_inicio
     FROM trucha_cruda_precio
     WHERE fecha_fin IS NULL
     ORDER BY fecha_inicio DESC
     LIMIT 1`
  )
  return rows[0]
}

const actualizarVigente = async (precioGramo) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `UPDATE trucha_cruda_precio
       SET fecha_fin = now()
       WHERE fecha_fin IS NULL`
    )

    const { rows } = await client.query(
      `INSERT INTO trucha_cruda_precio (precio_gramo, fecha_inicio)
       VALUES ($1, now())
       RETURNING *`,
      [precioGramo]
    )

    await client.query('COMMIT')
    return rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

module.exports = { obtenerVigente, actualizarVigente }