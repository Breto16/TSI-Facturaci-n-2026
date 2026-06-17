const Producto = require('../models/producto');

const getProductos = async (req, res) => {
  try {
    const productos = await Producto.listar();
    res.json(productos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

const getProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.obtenerPorId(id);

    if (!producto) {
      return res.status(404).json({ msg: 'Producto no existe' });
    }

    res.json(producto);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

const postProducto = async (req, res) => {
  const { codigo, descripcion, precio, prioridad, categoria } = req.body;

  if (!descripcion || precio == null) {
    return res.status(400).json({ msg: 'Descripción y precio son obligatorios' });
  }

  try {
    const nuevo = await Producto.crear({ codigo, descripcion, precio, prioridad, categoria });
    res.json(nuevo);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

const putProducto = async (req, res) => {
  const { id } = req.params;
  const { codigo, descripcion, precio, prioridad, categoria, disponible } = req.body;

  try {
    const productoActual = await Producto.obtenerPorId(id);

    if (!productoActual) {
      return res.status(404).json({ msg: 'Producto no existe' });
    }

    // Si el precio cambia, registrar histórico antes de actualizar
    if (precio != null && Number(precio) !== Number(productoActual.precio)) {
      await Producto.registrarCambioPrecio(id, productoActual.precio, precio);
    }

    const actualizado = await Producto.actualizar(id, {
      codigo, descripcion, precio, prioridad, categoria, disponible
    });

    res.json(actualizado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

const deleteProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.obtenerPorId(id);

    if (!producto) {
      return res.status(404).json({ msg: 'Producto no existe' });
    }

    await Producto.actualizar(id, { disponible: false });
    res.json({ msg: 'Producto desactivado' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

module.exports = { getProductos, getProducto, postProducto, putProducto, deleteProducto };