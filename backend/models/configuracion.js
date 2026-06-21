const pool = require('../db/connection')

const obtener = async (clave) => {
  const { rows } = await pool.query('SELECT valor FROM configuracion WHERE clave = $1', [clave])
  return rows[0]?.valor
}

const actualizar = async (clave, valor) => {
  const { rows } = await pool.query(
    `INSERT INTO configuracion (clave, valor) VALUES ($1, $2)
     ON CONFLICT (clave) DO UPDATE SET valor = $2
     RETURNING *`,
    [clave, valor]
  )
  return rows[0]
}

module.exports = { obtener, actualizar }