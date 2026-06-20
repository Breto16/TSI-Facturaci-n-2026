import apiClient from './apiClient'

export const imprimirFactura = async (facturaId) => {
  const { data } = await apiClient.post(`/imprimir/facturas/${facturaId}`)
  return data
}

export const abrirCaja = async () => {
  const { data } = await apiClient.post('/imprimir/caja')
  return data
}

export const imprimirCierre = async (datos) => {
  const { data } = await apiClient.post('/imprimir/cierre', datos)
  return data
}