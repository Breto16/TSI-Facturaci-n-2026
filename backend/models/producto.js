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
  return rows
}

const obtenerPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
  return rows[0];
};

const crear = async ({ codigo, descripcion, precio, prioridad, categoria }) => {
  const { rows } = await pool.query(
    `INSERT INTO productos (codigo, descripcion, precio, prioridad, categoria)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [codigo, descripcion, precio, prioridad || 0, categoria || 'salon']
  );
  return rows[0];
};

const actualizar = async (id, { codigo, descripcion, precio, prioridad, categoria, disponible }) => {
  const { rows } = await pool.query(
    `UPDATE productos SET
      codigo = COALESCE($1, codigo),
      descripcion = COALESCE($2, descripcion),
      precio = COALESCE($3, precio),
      prioridad = COALESCE($4, prioridad),
      categoria = COALESCE($5, categoria),
      disponible = COALESCE($6, disponible)
     WHERE id = $7
     RETURNING *`,
    [codigo, descripcion, precio, prioridad, categoria, disponible, id]
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

module.exports = { listar, obtenerPorId, crear, actualizar, registrarCambioPrecio };