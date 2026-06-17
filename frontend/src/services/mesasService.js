import apiClient from './apiClient'

export const getMesasConEstado = async () => {
  const { data } = await apiClient.get('/mesas/estado')
  return data
}
export const getMesas = async () => {
  const { data } = await apiClient.get('/mesas')
  return data
}