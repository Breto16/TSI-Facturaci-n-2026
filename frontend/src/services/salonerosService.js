import apiClient from './apiClient'

export const getSaloneros = async () => {
  const { data } = await apiClient.get('/saloneros')
  return data
}

export const crearSalonero = async (nombre) => {
  const { data } = await apiClient.post('/saloneros', { nombre })
  return data
}

export const toggleSalonero = async (id, disponible) => {
  const { data } = await apiClient.put(`/saloneros/${id}`, { disponible })
  return data
}