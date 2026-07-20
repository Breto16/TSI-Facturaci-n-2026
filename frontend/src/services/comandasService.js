import apiClient from './apiClient'

export const crearComanda = async (facturaId, mesaId, saloneroId, items, ficha, imprimirSalon) => {
  const { data } = await apiClient.post('/comandas', { facturaId, mesaId, saloneroId, items, ficha, imprimirSalon })
  return data
}

export const getComandasPorFactura = async (facturaId) => {
  const { data } = await apiClient.get(`/comandas/factura/${facturaId}`)
  return data
}

export const getComandasActivas = async () => {
  const { data } = await apiClient.get('/comandas/activas')
  return data
}

export const marcarItemDespachado = async (itemId, despachado = true) => {
  const { data } = await apiClient.put(`/comandas/items/${itemId}/despachar`, { despachado })
  return data
}

export const marcarTodoTipoDespachado = async (comandaId, categoria) => {
  const { data } = await apiClient.put(`/comandas/${comandaId}/despachar-tipo`, { categoria })
  return data
}

export const eliminarItemComanda = async (itemId) => {
  const { data } = await apiClient.delete(`/comandas/items/${itemId}`)
  return data
}

export const vaciarComanda = async (comandaId) => {
  const { data } = await apiClient.delete(`/comandas/${comandaId}/items`)
  return data
}

export const reimprimirComanda = async (comandaId, tipo) => {
  const { data } = await apiClient.post(`/comandas/${comandaId}/reimprimir`, { tipo })
  return data
}