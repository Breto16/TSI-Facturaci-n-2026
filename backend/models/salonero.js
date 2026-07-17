const pool = require('../db/connection')

const listar = async () => {
  const { rows } = await pool.query(`
    SELECT s.id, s.nombre, s.disponible, u.usuario AS usuario_login
    FROM saloneros s
    LEFT JOIN usuarios u ON u.id = s.usuario_id
    ORDER BY
      s.disponible DESC,
      CASE WHEN s.id = 1 THEN 0 ELSE 1 END ASC,
      s.nombre ASC
  `)
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

const vincularUsuario = async (id, usuarioId) => {
  const { rows } = await pool.query(
    `UPDATE saloneros SET usuario_id = $1 WHERE id = $2 RETURNING *`,
    [usuarioId, id]
  )
  return rows[0]
}

module.exports = { listar, crear, toggleDisponible, vincularUsuario }