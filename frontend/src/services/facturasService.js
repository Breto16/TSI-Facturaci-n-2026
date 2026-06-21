import apiClient from './apiClient'

export const getFacturasPorMesa = async (mesaId) => {
  const { data } = await apiClient.get(`/facturas/mesa/${mesaId}`)
  return data
}

export const crearFactura = async (mesaId) => {
  const { data } = await apiClient.post('/facturas', { mesa_id: mesaId })
  return data
}

export const getFactura = async (id) => {
  const { data } = await apiClient.get(`/facturas/${id}`)
  return data
}

export const getFacturas = async (params = {}) => {
  const { data } = await apiClient.get('/facturas', { params })
  return data
}
export const getItems = async (facturaId) => {
  const { data } = await apiClient.get(`/facturas/${facturaId}/items`)
  return data
}

export const agregarItem = async (facturaId, item) => {
  const { data } = await apiClient.post(`/facturas/${facturaId}/items`, item)
  return data
}

export const actualizarItem = async (facturaId, itemId, cantidad) => {
  const { data } = await apiClient.put(`/facturas/${facturaId}/items/${itemId}`, { cantidad })
  return data
}

export const eliminarItem = async (facturaId, itemId) => {
  const { data } = await apiClient.delete(`/facturas/${facturaId}/items/${itemId}`)
  return data
}

export const actualizarEncabezado = async (facturaId, datos) => {
  const { data } = await apiClient.put(`/facturas/${facturaId}/encabezado`, datos)
  return data
}

export const actualizarEstado = async (facturaId, datos) => {
  const { data } = await apiClient.put(`/facturas/${facturaId}/estado`, datos)
  return data
}

export const actualizarTotales = async (facturaId, datos) => {
  const { data } = await apiClient.put(`/facturas/${facturaId}/totales`, datos)
  return data
}

export const getHijas = async (facturaId) => {
  const { data } = await apiClient.get(`/facturas/${facturaId}/hijas`)
  return data
}

export const crearHija = async (facturaId) => {
  const { data } = await apiClient.post(`/facturas/${facturaId}/hijas`)
  return data
}

export const moverItems = async (facturaId, payload) => {
  const { data } = await apiClient.post(`/facturas/${facturaId}/mover`, payload)
  return data
}

export const actualizarDetalle = async (facturaId, detalle) => {
  const { data } = await apiClient.put(`/facturas/${facturaId}/encabezado`, { detalle })
  return data
}
export const actualizarTruchasPendientes = async (facturaId, cantidad) => {
  const { data } = await apiClient.put(`/facturas/${facturaId}/truchas-pendientes`, { cantidad })
  return data
}