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

export const getProductosParaConsultas = async () => {
  const { data } = await apiClient.get('/productos/consultas/listar')
  return data
}

export const getVariantes = async (productoId) => {
  const { data } = await apiClient.get(`/productos/${productoId}/variantes`)
  return data
}

export const crearVariante = async (productoId, nombre) => {
  const { data } = await apiClient.post(`/productos/${productoId}/variantes`, { nombre })
  return data
}

export const eliminarVariante = async (varianteId) => {
  const { data } = await apiClient.delete(`/productos/variantes/${varianteId}`)
  return data
}