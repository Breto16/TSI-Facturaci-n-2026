const pool = require('../db/connection')

const listarPorMesa = async (mesaId) => {
  const { rows } = await pool.query(
    `SELECT id, estado, detalle, subtotal, total, fecha_apertura
     FROM facturas
     WHERE mesa_id = $1
     AND (
       estado IN ('abierta', 'impresa')
       OR (
         estado = 'dividida'
         AND EXISTS (
           SELECT 1 FROM factura_items fi WHERE fi.factura_id = facturas.id
         )
       )
     )
     ORDER BY fecha_apertura ASC`,
    [mesaId]
  )
  return rows
}

const crear = async (mesaId) => {
  const { rows } = await pool.query(
    `INSERT INTO facturas (mesa_id, salonero_id, estado, subtotal, descuento, servicio, total)
     VALUES ($1, 1, 'abierta', 0, 0, 0, 0)
     RETURNING id, mesa_id, salonero_id, estado, detalle, subtotal, descuento, servicio, total, fecha_apertura`,
    [mesaId]
  )
  return rows[0]
}

const obtenerPorId = async (id) => {
  const { rows } = await pool.query(
    `SELECT f.*, s.nombre AS salonero_nombre, m.nombre AS mesa_nombre
     FROM facturas f
     LEFT JOIN saloneros s ON s.id = f.salonero_id
     LEFT JOIN mesas m ON m.id = f.mesa_id
     WHERE f.id = $1`,
    [id]
  )
  return rows[0]
}

const listarPaginado = async ({ estados, fechaDesde, fechaHasta, pagina, limit }) => {
  const condiciones = []
  const valores = []
  let idx = 1

  if (estados && estados.length > 0) {
    condiciones.push(`f.estado = ANY($${idx}::estado_factura[])`)
    valores.push(estados)
    idx++
  }

  if (fechaDesde) {
    condiciones.push(`f.fecha_apertura >= $${idx}`)
    valores.push(fechaDesde)
    idx++
  }

  if (fechaHasta) {
    condiciones.push(`f.fecha_apertura <= $${idx}`)
    valores.push(fechaHasta + ' 23:59:59')
    idx++
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : ''

  const offset = (pagina - 1) * limit

  const { rows } = await pool.query(
    `SELECT
      f.id, f.estado, f.detalle, f.total,
      f.fecha_apertura, f.fecha_cierre,
      m.nombre AS mesa_nombre,
      s.nombre AS salonero_nombre
     FROM facturas f
     LEFT JOIN mesas m ON m.id = f.mesa_id
     LEFT JOIN saloneros s ON s.id = f.salonero_id
     ${where}
     ORDER BY f.fecha_apertura DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...valores, limit, offset]
  )

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM facturas f ${where}`,
    valores
  )

  return {
    facturas: rows,
    total: parseInt(countRows[0].count),
  }
}
const actualizarEncabezado = async (id, { mesa_id, salonero_id, detalle }) => {
  const { rows } = await pool.query(
    `UPDATE facturas SET
      mesa_id = COALESCE($1, mesa_id),
      salonero_id = COALESCE($2, salonero_id),
      detalle = $3
     WHERE id = $4
     RETURNING *`,
    [mesa_id, salonero_id, detalle, id]
  )
  return rows[0]
}

const actualizarEstado = async (id, estado, extras = {}) => {
  const { tipo_pago, monto_recibido, cambio } = extras
  const { rows } = await pool.query(
    `UPDATE facturas SET
      estado = $1::estado_factura,
      tipo_pago = COALESCE($2::tipo_pago, tipo_pago),
      monto_recibido = COALESCE($3, monto_recibido),
      cambio = COALESCE($4, cambio),
      fecha_cierre = CASE WHEN $1 IN ('pagada', 'anulada') THEN now() ELSE fecha_cierre END
     WHERE id = $5
     RETURNING *`,
    [estado, tipo_pago || null, monto_recibido || null, cambio || null, id]
  )
  return rows[0]
}

const recalcularTotales = async (id, descuento = null, cobrarServicio = true, datosTrucha = null) => {
  const { rows: items } = await pool.query(
    'SELECT SUM(total) as subtotal FROM factura_items WHERE factura_id = $1',
    [id]
  )
  const subtotal = parseFloat(items[0].subtotal) || 0
  const servicio = cobrarServicio ? Math.round(subtotal * 0.1) : 0
  const desc = descuento != null ? parseFloat(descuento) : 0
  const total = subtotal - desc + servicio

  if (datosTrucha) {
    const { tieneTrucha, gramos, precioGramo, total: truchaTotal } = datosTrucha
    const { rows } = await pool.query(
      `UPDATE facturas SET
        subtotal = $1, servicio = $2, descuento = $3, total = $4,
        tiene_trucha = $5, trucha_gramos = $6, trucha_precio_gramo = $7, trucha_total = $8
       WHERE id = $9
       RETURNING *`,
      [subtotal, servicio, desc, total, tieneTrucha, gramos, precioGramo, truchaTotal, id]
    )
    return rows[0]
  }

  const { rows } = await pool.query(
    `UPDATE facturas SET
      subtotal = $1, servicio = $2, descuento = $3, total = $4
     WHERE id = $5
     RETURNING *`,
    [subtotal, servicio, desc, total, id]
  )
  return rows[0]
}

const crearHija = async (facturapadreId, mesaId, saloneroId) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: hija } = await client.query(
      `INSERT INTO facturas (mesa_id, salonero_id, estado, subtotal, descuento, servicio, total)
       VALUES ($1, $2, 'abierta', 0, 0, 0, 0)
       RETURNING *`,
      [mesaId, saloneroId]
    )

    await client.query(
      `INSERT INTO factura_divisiones (factura_padre_id, factura_hija_id)
       VALUES ($1, $2)`,
      [facturapadreId, hija[0].id]
    )

    await client.query('COMMIT')
    return hija[0]
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

const listarHijas = async (facturapadreId) => {
  const { rows } = await pool.query(
    `SELECT f.id, f.estado, f.detalle, f.subtotal, f.servicio, f.descuento, f.total
     FROM facturas f
     JOIN factura_divisiones fd ON fd.factura_hija_id = f.id
     WHERE fd.factura_padre_id = $1
     ORDER BY f.id ASC`,
    [facturapadreId]
  )
  return rows
}
const moverItemsTransaccion = async (facturaOrigenId, facturaDestinoId, tipo, itemId) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (tipo === 'todo') {
      await client.query(
        'UPDATE factura_items SET factura_id = $1 WHERE factura_id = $2',
        [facturaDestinoId, facturaOrigenId]
      )
    } else {
      const { rows: itemRows } = await client.query(
        'SELECT * FROM factura_items WHERE id = $1', [itemId]
      )
      if (!itemRows[0]) throw new Error('Item no existe')
      const item = itemRows[0]

      const { rows: existente } = await client.query(
        `SELECT id, cantidad FROM factura_items
         WHERE factura_id = $1 AND producto_id = $2`,
        [facturaDestinoId, item.producto_id]
      )

      const cantidadMover = tipo === 'uno' ? 1 : item.cantidad

      if (tipo === 'fila' || (tipo === 'uno' && item.cantidad <= 1)) {
        if (existente.length > 0) {
          const nuevaCantidad = existente[0].cantidad + cantidadMover
          await client.query(
            'UPDATE factura_items SET cantidad = $1, total = $2 WHERE id = $3',
            [nuevaCantidad, item.precio_unitario * nuevaCantidad, existente[0].id]
          )
          await client.query('DELETE FROM factura_items WHERE id = $1', [item.id])
        } else {
          await client.query(
            'UPDATE factura_items SET factura_id = $1 WHERE id = $2',
            [facturaDestinoId, item.id]
          )
        }
      } else if (tipo === 'uno') {
        const nuevaCantidadOrigen = item.cantidad - 1
        await client.query(
          'UPDATE factura_items SET cantidad = $1, total = $2 WHERE id = $3',
          [nuevaCantidadOrigen, item.precio_unitario * nuevaCantidadOrigen, item.id]
        )
        if (existente.length > 0) {
          const nuevaCantidad = existente[0].cantidad + 1
          await client.query(
            'UPDATE factura_items SET cantidad = $1, total = $2 WHERE id = $3',
            [nuevaCantidad, item.precio_unitario * nuevaCantidad, existente[0].id]
          )
        } else {
          await client.query(
            `INSERT INTO factura_items (factura_id, producto_id, descripcion, precio_unitario, cantidad, total)
             VALUES ($1, $2, $3, $4, 1, $4)`,
            [facturaDestinoId, item.producto_id, item.descripcion, item.precio_unitario]
          )
        }
      }
    }

    await client.query('COMMIT')
    await recalcularTotales(facturaOrigenId)
    await recalcularTotales(facturaDestinoId)

  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
const actualizarTruchasPendientes = async (id, cantidad) => {
  const { rows } = await pool.query(
    `UPDATE facturas SET truchas_pendientes_cocina = $1 WHERE id = $2 RETURNING *`,
    [cantidad, id]
  )
  return rows[0]
}
module.exports = {
  listarPorMesa, crear, obtenerPorId, listarPaginado,
  actualizarEncabezado, actualizarEstado, recalcularTotales,
  crearHija, listarHijas, moverItemsTransaccion, actualizarTruchasPendientes
}
