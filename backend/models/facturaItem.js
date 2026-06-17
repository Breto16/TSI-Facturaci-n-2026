const pool = require('../db/connection')

const listarPorFactura = async (facturaId) => {
  const { rows } = await pool.query(
    `SELECT fi.id, fi.producto_id, fi.descripcion, fi.precio_unitario, fi.cantidad, fi.total
     FROM factura_items fi
     WHERE fi.factura_id = $1
     ORDER BY fi.id ASC`,
    [facturaId]
  )
  return rows
}

const agregar = async ({ factura_id, producto_id, descripcion, precio_unitario, cantidad }) => {
  const total = precio_unitario * cantidad
  const { rows } = await pool.query(
    `INSERT INTO factura_items (factura_id, producto_id, descripcion, precio_unitario, cantidad, total)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [factura_id, producto_id, descripcion, precio_unitario, cantidad, total]
  )
  return rows[0]
}

const actualizar = async (id, cantidad) => {
  const { rows: current } = await pool.query(
    'SELECT precio_unitario FROM factura_items WHERE id = $1', [id]
  )
  if (!current[0]) return null
  const total = current[0].precio_unitario * cantidad
  const { rows } = await pool.query(
    `UPDATE factura_items SET cantidad = $1, total = $2 WHERE id = $3 RETURNING *`,
    [cantidad, total, id]
  )
  return rows[0]
}

const eliminar = async (id) => {
  await pool.query('DELETE FROM factura_items WHERE id = $1', [id])
}

module.exports = { listarPorFactura, agregar, actualizar, eliminar }