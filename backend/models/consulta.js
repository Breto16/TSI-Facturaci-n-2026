const pool = require('../db/connection')

const ventaPorProductos = async (codigos, fechaDesde, fechaHasta) => {
  const { rows } = await pool.query(`
    SELECT
      fi.factura_id,
      fi.descripcion,
      fi.cantidad,
      fi.total
    FROM factura_items fi
    JOIN facturas f ON f.id = fi.factura_id
    JOIN productos p ON p.id = fi.producto_id
    WHERE p.codigo = ANY($1::text[])
      AND f.estado = 'pagada'
      AND f.fecha_apertura >= $2
      AND f.fecha_apertura <= $3
    ORDER BY fi.factura_id ASC
  `, [codigos, fechaDesde, fechaHasta + ' 23:59:59'])

  const total = rows.reduce((acc, r) => acc + Number(r.total), 0)
  const totalArticulos = rows.reduce((acc, r) => acc + Number(r.cantidad), 0)
  return { rows, total, totalArticulos }
}

const servicioPorSalonero = async (saloneroId, fechaDesde, fechaHasta) => {
    const { rows } = await pool.query(`
    SELECT id AS factura_id, servicio, fecha_apertura
    FROM facturas
    WHERE salonero_id = $1
      AND estado = 'pagada'
      AND fecha_apertura >= $2
      AND fecha_apertura <= $3
    ORDER BY id ASC
  `, [saloneroId, fechaDesde, fechaHasta + ' 23:59:59'])

    const total = rows.reduce((acc, r) => acc + Number(r.servicio), 0)
    return { rows, total }
}


const crearConsultaRapida = async (titulo, codigos) => {
  const { rows } = await pool.query(
    `INSERT INTO consultas_rapidas (titulo, producto_codigos) VALUES ($1, $2) RETURNING *`,
    [titulo, codigos]
  )
  return rows[0]
}

const listarConsultasRapidas = async () => {
  const { rows } = await pool.query(
    'SELECT id, titulo, producto_codigos FROM consultas_rapidas ORDER BY titulo ASC'
  )
  return rows
}

const eliminarConsultaRapida = async (id) => {
    await pool.query('DELETE FROM consultas_rapidas WHERE id = $1', [id])
}

const totalesCierre = async (fechaDesde, fechaHasta) => {
    const { rows } = await pool.query(`
    SELECT
      COALESCE(SUM(total), 0) AS total_general,
      COALESCE(SUM(CASE WHEN tiene_trucha THEN trucha_total ELSE 0 END), 0) AS total_trucha,
      COALESCE(SUM(CASE WHEN tipo_pago = 'tarjeta' THEN total ELSE 0 END), 0) AS total_tarjeta,
      COALESCE(SUM(CASE WHEN tipo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS total_efectivo
    FROM facturas
    WHERE estado = 'pagada'
      AND fecha_apertura >= $1
      AND fecha_apertura <= $2
  `, [fechaDesde, fechaHasta + ' 23:59:59'])

    return rows[0]
}

const serviciosPorTodosSaloneros = async (fechaDesde, fechaHasta) => {
    const { rows } = await pool.query(`
    SELECT
      s.id AS salonero_id,
      s.nombre AS salonero_nombre,
      SUM(f.servicio) AS total_servicio
    FROM facturas f
    JOIN saloneros s ON s.id = f.salonero_id
    WHERE f.estado = 'pagada'
      AND f.fecha_apertura >= $1
      AND f.fecha_apertura <= $2
    GROUP BY s.id, s.nombre
    HAVING SUM(f.servicio) > 0
    ORDER BY s.nombre ASC
  `, [fechaDesde, fechaHasta + ' 23:59:59'])

    return rows
}
const guardarCierre = async ({
    fecha, totalSistema, totalEfectivoContado, totalTarjetaDatafono, diferencia, creadoPor
}) => {
    const { rows } = await pool.query(
        `INSERT INTO cierres_caja
      (fecha, total_sistema, total_efectivo_contado, total_tarjeta_datafono, diferencia, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (fecha) DO UPDATE SET
       total_sistema = $2,
       total_efectivo_contado = $3,
       total_tarjeta_datafono = $4,
       diferencia = $5,
       creado_por = $6,
       creado_en = now()
     RETURNING *`,
        [fecha, totalSistema, totalEfectivoContado, totalTarjetaDatafono, diferencia, creadoPor]
    )
    return rows[0]
}

module.exports = {
    ventaPorProductos,
    servicioPorSalonero,
    listarConsultasRapidas,
    crearConsultaRapida,
    eliminarConsultaRapida,
    totalesCierre,
    serviciosPorTodosSaloneros,
    guardarCierre,
}