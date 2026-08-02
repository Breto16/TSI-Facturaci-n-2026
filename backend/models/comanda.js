const pool = require('../db/connection')

const crear = async ({ mesaId, saloneroId, facturaId, items, ficha, imprimirSalon }) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO comandas (mesa_id, salonero_id, factura_id, ficha, imprimir_salon) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [mesaId, saloneroId, facturaId, ficha || null, !!imprimirSalon]
    )
    const comanda = rows[0]

    const itemsInsertados = []
    for (const item of items) {
      const { rows: itemRows } = await client.query(
        `INSERT INTO comanda_items
          (comanda_id, producto_id, descripcion, cantidad, categoria, variante, acompanamiento, detalle, sale_antes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          comanda.id,
          item.productoId,
          item.descripcion,
          item.cantidad,
          item.categoria,
          item.variante || null,
          item.acompanamiento || null,
          item.detalle || null,
          !!item.saleAntes,
        ]
      )
      itemsInsertados.push(itemRows[0])
    }

    await client.query('COMMIT')
    return { ...comanda, items: itemsInsertados }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Si ya existe un item activo (no cancelado, no despachado) con exactamente
// el mismo producto/variante/acompañamiento/detalle/sale_antes, suma la
// cantidad ahí en vez de crear una fila nueva — resuelve que pedir "otro
// pollo igual" duplique renglones en validación.
const agregarItems = async (comandaId, items) => {
  const itemsResultado = []

  for (const item of items) {
    const { rows: existentes } = await pool.query(
      `SELECT * FROM comanda_items
       WHERE comanda_id = $1 AND producto_id = $2
         AND COALESCE(variante,'') = COALESCE($3,'')
         AND COALESCE(acompanamiento::text,'') = COALESCE($4,'')
         AND COALESCE(detalle,'') = COALESCE($5,'')
         AND sale_antes = $6
         AND cancelado = false AND despachado = false`,
      [comandaId, item.productoId, item.variante || null, item.acompanamiento || null, item.detalle || null, !!item.saleAntes]
    )

    if (existentes.length > 0) {
      const { rows } = await pool.query(
        `UPDATE comanda_items SET cantidad = cantidad + $1 WHERE id = $2 RETURNING *`,
        [item.cantidad, existentes[0].id]
      )
      itemsResultado.push(rows[0])
    } else {
      const { rows } = await pool.query(
        `INSERT INTO comanda_items
          (comanda_id, producto_id, descripcion, cantidad, categoria, variante, acompanamiento, detalle, sale_antes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          comandaId,
          item.productoId,
          item.descripcion,
          item.cantidad,
          item.categoria,
          item.variante || null,
          item.acompanamiento || null,
          item.detalle || null,
          !!item.saleAntes,
        ]
      )
      itemsResultado.push(rows[0])
    }
  }

  return itemsResultado
}

// Solo actualiza la ficha si la comanda todavía no tenía una — nunca
// pisa una ficha ya asignada.
const actualizarFicha = async (comandaId, ficha) => {
  const { rows } = await pool.query(
    `UPDATE comandas SET ficha = $1 WHERE id = $2 AND ficha IS NULL RETURNING *`,
    [ficha, comandaId]
  )
  return rows[0]
}

const cancelarItem = async (itemId) => {
  const { rows } = await pool.query(
    `UPDATE comanda_items SET cancelado = true, cancelado_en = now() WHERE id = $1 RETURNING *`,
    [itemId]
  )
  return rows[0]
}

// Ajusta la cantidad de un item ya enviado (mientras no esté despachado).
// Si el resultado llega a 0 o menos, se trata como una cancelación (soft),
// nunca como un borrado duro.
const ajustarCantidadItem = async (itemId, delta) => {
  const { rows: actual } = await pool.query('SELECT * FROM comanda_items WHERE id = $1', [itemId])
  if (!actual[0]) return null

  const nuevaCantidad = actual[0].cantidad + delta

  if (nuevaCantidad <= 0) {
    const { rows } = await pool.query(
      `UPDATE comanda_items SET cancelado = true, cancelado_en = now() WHERE id = $1 RETURNING *`,
      [itemId]
    )
    return rows[0]
  }

  const { rows } = await pool.query(
    `UPDATE comanda_items SET cantidad = $1 WHERE id = $2 RETURNING *`,
    [nuevaCantidad, itemId]
  )
  return rows[0]
}

const obtenerPorId = async (id) => {
  const { rows } = await pool.query(`
    SELECT c.*, m.nombre AS mesa_nombre, s.nombre AS salonero_nombre, f.detalle AS factura_detalle
    FROM comandas c
    LEFT JOIN mesas m ON m.id = c.mesa_id
    LEFT JOIN saloneros s ON s.id = c.salonero_id
    LEFT JOIN facturas f ON f.id = c.factura_id
    WHERE c.id = $1
  `, [id])

  if (!rows[0]) return null

  const { rows: items } = await pool.query(
    'SELECT * FROM comanda_items WHERE comanda_id = $1 ORDER BY id ASC',
    [id]
  )

  return { ...rows[0], items }
}

const listarPorFactura = async (facturaId) => {
  const { rows: comandas } = await pool.query(`
    SELECT c.*, s.nombre AS salonero_nombre, f.detalle AS factura_detalle
    FROM comandas c
    LEFT JOIN saloneros s ON s.id = c.salonero_id
    LEFT JOIN facturas f ON f.id = c.factura_id
    WHERE c.factura_id = $1
    ORDER BY c.creado_en DESC
  `, [facturaId])

  if (comandas.length === 0) return []

  const ids = comandas.map(c => c.id)
  const { rows: items } = await pool.query(
    'SELECT * FROM comanda_items WHERE comanda_id = ANY($1::int[]) ORDER BY id ASC',
    [ids]
  )

  return comandas.map(c => ({
    ...c,
    items: items.filter(i => i.comanda_id === c.id),
  }))
}

const listarActivas = async () => {
  const { rows: comandas } = await pool.query(`
    SELECT DISTINCT c.*, m.nombre AS mesa_nombre, s.nombre AS salonero_nombre, f.detalle AS factura_detalle
    FROM comandas c
    JOIN comanda_items ci ON ci.comanda_id = c.id
    LEFT JOIN mesas m ON m.id = c.mesa_id
    LEFT JOIN saloneros s ON s.id = c.salonero_id
    LEFT JOIN facturas f ON f.id = c.factura_id
    WHERE ci.despachado = false AND ci.cancelado = false
    ORDER BY c.creado_en ASC
  `)

  if (comandas.length === 0) return []

  const ids = comandas.map(c => c.id)
  const { rows: items } = await pool.query(
    'SELECT * FROM comanda_items WHERE comanda_id = ANY($1::int[]) AND cancelado = false ORDER BY id ASC',
    [ids]
  )

  return comandas.map(c => ({
    ...c,
    items: items.filter(i => i.comanda_id === c.id),
  }))
}

const marcarItemDespachado = async (itemId, despachado) => {
  const { rows } = await pool.query(
    `UPDATE comanda_items SET
      despachado = $1,
      despachado_en = CASE WHEN $1 THEN now() ELSE NULL END
     WHERE id = $2
     RETURNING *`,
    [despachado, itemId]
  )
  return rows[0]
}

const marcarTodoTipoDespachado = async (comandaId, categoria) => {
  const { rows } = await pool.query(
    `UPDATE comanda_items SET
      despachado = true,
      despachado_en = now()
     WHERE comanda_id = $1 AND categoria = $2
     RETURNING *`,
    [comandaId, categoria]
  )
  return rows
}

// Borrado duro (sin rastro) — marca items_eliminados en la comanda padre
// para que el cajero siga viendo el recordatorio de validar la factura.
const eliminarItem = async (itemId) => {
  const { rows } = await pool.query('SELECT comanda_id FROM comanda_items WHERE id = $1', [itemId])
  const comandaId = rows[0]?.comanda_id

  await pool.query('DELETE FROM comanda_items WHERE id = $1', [itemId])

  if (comandaId) {
    await pool.query('UPDATE comandas SET items_eliminados = true WHERE id = $1', [comandaId])
  }

  return comandaId
}

const eliminarTodosItems = async (comandaId) => {
  await pool.query('DELETE FROM comanda_items WHERE comanda_id = $1', [comandaId])
  await pool.query('UPDATE comandas SET items_eliminados = true WHERE id = $1', [comandaId])
}

module.exports = {
  crear,
  agregarItems,
  actualizarFicha,
  cancelarItem,
  ajustarCantidadItem,
  obtenerPorId,
  listarPorFactura,
  listarActivas,
  marcarItemDespachado,
  marcarTodoTipoDespachado,
  eliminarItem,
  eliminarTodosItems,
}