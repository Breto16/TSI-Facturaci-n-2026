const pool = require('../db/connection')

const listar = async () => {
  const { rows } = await pool.query(
    `SELECT id, nombre, disponible FROM saloneros
     ORDER BY
       disponible DESC,
       CASE WHEN id = 1 THEN 0 ELSE 1 END ASC,
       nombre ASC`
  )
  return rows
}

const crear = async (nombre) => {
  const { rows } = await pool.query(
    `INSERT INTO saloneros (nombre, disponible) VALUES ($1, true) RETURNING *`,
    [nombre]
  )
  return rows[0]
}

const toggleDisponible = async (id, disponible) => {
  const { rows } = await pool.query(
    `UPDATE saloneros SET disponible = $1 WHERE id = $2 RETURNING *`,
    [disponible, id]
  )
  return rows[0]
}

module.exports = { listar, crear, toggleDisponible }