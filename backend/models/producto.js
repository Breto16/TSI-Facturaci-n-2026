const pool = require('../db/connection');

const listar = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM productos
     ORDER BY
       disponible DESC,
       CASE WHEN prioridad = 0 THEN 1 ELSE 0 END ASC,
       prioridad ASC,
       descripcion ASC`
  )

  const { rows: variantes } = await pool.query(
    `SELECT * FROM producto_variantes WHERE activo = true ORDER BY nombre ASC`
  )

  const porProducto = {}
  for (const v of variantes) {
    if (!porProducto[v.producto_id]) porProducto[v.producto_id] = []
    porProducto[v.producto_id].push(v)
  }

  return rows.map(p => ({ ...p, variantes: porProducto[p.id] || [] }))
}

const listarParaConsultas = async () => {
  const { rows } = await pool.query(`
    SELECT DISTINCT ON (codigo) id, codigo, descripcion, precio, disponible
    FROM productos
    WHERE codigo IS NOT NULL AND codigo != ''
    ORDER BY codigo, disponible DESC, id DESC
  `)
  return rows
}
const obtenerPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
  return rows[0];
};
const obtenerVariosPorId = async (ids) => {
  const { rows } = await pool.query('SELECT * FROM productos WHERE id = ANY($1::int[])', [ids])
  return rows
}

const crear = async ({ codigo, descripcion, precio, prioridad, categoria, requiereAcompanamiento, tieneVariantes, requiereFicha, prefijoEnVariante }) => {
  const { rows } = await pool.query(
    `INSERT INTO productos (codigo, descripcion, precio, prioridad, categoria, requiere_acompanamiento, tiene_variantes, requiere_ficha, prefijo_en_variante)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [codigo, descripcion, precio, prioridad || 0, categoria || 'salon', requiereAcompanamiento || false, tieneVariantes || false, requiereFicha || false, prefijoEnVariante || false]
  );
  return rows[0];
};

const actualizar = async (id, { codigo, descripcion, precio, prioridad, categoria, disponible, requiereAcompanamiento, tieneVariantes, requiereFicha, prefijoEnVariante }) => {
  const { rows } = await pool.query(
    `UPDATE productos SET
      codigo = COALESCE($1, codigo),
      descripcion = COALESCE($2, descripcion),
      precio = COALESCE($3, precio),
      prioridad = COALESCE($4, prioridad),
      categoria = COALESCE($5, categoria),
      disponible = COALESCE($6, disponible),
      requiere_acompanamiento = COALESCE($7, requiere_acompanamiento),
      tiene_variantes = COALESCE($8, tiene_variantes),
      requiere_ficha = COALESCE($9, requiere_ficha),
      prefijo_en_variante = COALESCE($10, prefijo_en_variante)
     WHERE id = $11
     RETURNING *`,
    [codigo, descripcion, precio, prioridad, categoria, disponible, requiereAcompanamiento, tieneVariantes, requiereFicha, prefijoEnVariante, id]
  );
  return rows[0];
};

const registrarCambioPrecio = async (productoId, precioAnterior, precioNuevo) => {
  await pool.query(
    `INSERT INTO producto_historico_precio (producto_id, precio_anterior, precio_nuevo)
     VALUES ($1, $2, $3)`,
    [productoId, precioAnterior, precioNuevo]
  );
};

const listarVariantes = async (productoId) => {
  const { rows } = await pool.query(
    'SELECT * FROM producto_variantes WHERE producto_id = $1 ORDER BY nombre ASC',
    [productoId]
  )
  return rows
}

const crearVariante = async (productoId, nombre) => {
  const { rows } = await pool.query(
    'INSERT INTO producto_variantes (producto_id, nombre) VALUES ($1, $2) RETURNING *',
    [productoId, nombre]
  )
  return rows[0]
}

const eliminarVariante = async (id) => {
  await pool.query('DELETE FROM producto_variantes WHERE id = $1', [id])
}

module.exports = {
  listar,
  listarParaConsultas,
  obtenerPorId,
  obtenerVariosPorId,
  crear,
  actualizar,
  registrarCambioPrecio,
  listarVariantes,
  crearVariante,
  eliminarVariante,
};