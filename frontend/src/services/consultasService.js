import apiClient from './apiClient'

export const ventaPorProductos = async (codigos, fechaDesde, fechaHasta) => {
  const { data } = await apiClient.post('/consultas/venta-productos', { codigos, fechaDesde, fechaHasta })
  return data
}

export const servicioPorSalonero = async (saloneroId, fechaDesde, fechaHasta) => {
  const { data } = await apiClient.post('/consultas/servicio-salonero', { saloneroId, fechaDesde, fechaHasta })
  return data
}

export const getConsultasRapidas = async () => {
  const { data } = await apiClient.get('/consultas/rapidas')
  return data
}

export const crearConsultaRapida = async (titulo, codigos) => {
  const { data } = await apiClient.post('/consultas/rapidas', { titulo, codigos })
  return data
}

export const eliminarConsultaRapida = async (id) => {
  const { data } = await apiClient.delete(`/consultas/rapidas/${id}`)
  return data
}

export const getCierre = async (fechaDesde, fechaHasta) => {
  const { data } = await apiClient.get('/consultas/cierre', { params: { fechaDesde, fechaHasta } })
  return data
}
export const guardarCierre = async (datos) => {
  const { data } = await apiClient.post('/consultas/cierre', datos)
  return data
}