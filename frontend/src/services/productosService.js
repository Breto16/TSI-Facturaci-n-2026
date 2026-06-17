import apiClient from './apiClient';

export const getProductos = async () => {
  const { data } = await apiClient.get('/productos');
  return data;
};

export const crearProducto = async (producto) => {
  const { data } = await apiClient.post('/productos', producto);
  return data;
};

export const actualizarProducto = async (id, producto) => {
  const { data } = await apiClient.put(`/productos/${id}`, producto);
  return data;
};

export const eliminarProducto = async (id) => {
  const { data } = await apiClient.delete(`/productos/${id}`);
  return data;
};