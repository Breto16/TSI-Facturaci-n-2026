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

const moverItem = async (itemId, facturaDestinoId) => {
  const { rows } = await pool.query(
    `UPDATE factura_items SET factura_id = $1 WHERE id = $2 RETURNING *`,
    [facturaDestinoId, itemId]
  )
  return rows[0]
}

const agregarOIncrementar = async ({ factura_id, producto_id, descripcion, precio_unitario, cantidad }) => {
  const { rows: existente } = await pool.query(
    `SELECT id, cantidad FROM factura_items
     WHERE factura_id = $1 AND producto_id = $2`,
    [factura_id, producto_id]
  )

  if (existente.length > 0) {
    const nuevaCantidad = existente[0].cantidad + cantidad
    const total = precio_unitario * nuevaCantidad
    const { rows } = await pool.query(
      `UPDATE factura_items SET cantidad = $1, total = $2 WHERE id = $3 RETURNING *`,
      [nuevaCantidad, total, existente[0].id]
    )
    return rows[0]
  } else {
    return agregar({ factura_id, producto_id, descripcion, precio_unitario, cantidad })
  }
}

const decrementarOEliminar = async (itemId, cantidad) => {
  const { rows: current } = await pool.query(
    'SELECT * FROM factura_items WHERE id = $1', [itemId]
  )
  if (!current[0]) return null

  if (current[0].cantidad <= cantidad) {
    await pool.query('DELETE FROM factura_items WHERE id = $1', [itemId])
    return null
  }

  const nuevaCantidad = current[0].cantidad - cantidad
  const total = current[0].precio_unitario * nuevaCantidad
  const { rows } = await pool.query(
    `UPDATE factura_items SET cantidad = $1, total = $2 WHERE id = $3 RETURNING *`,
    [nuevaCantidad, total, itemId]
  )
  return rows[0]
}

module.exports = {
  listarPorFactura, agregar, actualizar, eliminar,
  moverItem, agregarOIncrementar, decrementarOEliminar
}

