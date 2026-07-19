const pool = require('../db/connection')

const crear = async ({ mesaId, saloneroId, facturaId, items, ficha }) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO comandas (mesa_id, salonero_id, factura_id, ficha) VALUES ($1, $2, $3, $4) RETURNING *`,
      [mesaId, saloneroId, facturaId, ficha || null]
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
    SELECT c.*, m.nombre AS mesa_nombre, s.nombre AS salonero_nombre, f.detalle AS factura_detalle
    FROM comandas c
    LEFT JOIN mesas m ON m.id = c.mesa_id
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
    WHERE ci.despachado = false
    ORDER BY c.creado_en ASC
  `)

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

module.exports = {
  crear,
  obtenerPorId,
  listarPorFactura,
  listarActivas,
  marcarItemDespachado,
  marcarTodoTipoDespachado,
}