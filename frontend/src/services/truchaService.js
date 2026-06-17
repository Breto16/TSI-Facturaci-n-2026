import apiClient from './apiClient'

export const getPrecioTruchaVigente = async () => {
  const { data } = await apiClient.get('/trucha/vigente')
  return data
}

export const actualizarPrecioTrucha = async (precioGramo) => {
  const { data } = await apiClient.put('/trucha/vigente', { precio_gramo: precioGramo })
  return data
}