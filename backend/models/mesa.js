const pool = require('../db/connection')

const listarConEstado = async () => {
  const { rows } = await pool.query(`
    SELECT
      m.id,
      m.nombre,
      m.activa,
      COUNT(f.id) FILTER (
        WHERE f.estado IN ('abierta', 'impresa')
        OR (
          f.estado = 'dividida'
          AND EXISTS (
            SELECT 1 FROM factura_items fi WHERE fi.factura_id = f.id
          )
        )
      ) AS facturas_activas,
      CASE
        WHEN COUNT(f.id) FILTER (
          WHERE f.estado IN ('abierta', 'impresa')
          OR (
            f.estado = 'dividida'
            AND EXISTS (
              SELECT 1 FROM factura_items fi WHERE fi.factura_id = f.id
            )
          )
        ) = 0
          THEN 'disponible'
        WHEN COUNT(f.id) FILTER (
          WHERE f.estado = 'dividida'
          AND EXISTS (
            SELECT 1 FROM factura_items fi WHERE fi.factura_id = f.id
          )
        ) > 0
          THEN 'dividida'
        WHEN COUNT(f.id) FILTER (WHERE f.estado = 'impresa') > 0
          THEN 'porPagar'
        ELSE 'ocupada'
      END AS estado
    FROM mesas m
    LEFT JOIN facturas f
      ON f.mesa_id = m.id
      AND f.estado IN ('abierta', 'impresa', 'dividida')
    WHERE m.activa = true
    GROUP BY m.id, m.nombre, m.activa
    ORDER BY m.id
  `)
  return rows
}

const listar = async () => {
  const { rows } = await pool.query(
    'SELECT id, nombre FROM mesas WHERE activa = true ORDER BY id'
  )
  return rows
}

module.exports = { listarConEstado, listar }
