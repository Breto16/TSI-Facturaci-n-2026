import apiClient from './apiClient'

export const validarCierrePassword = async (password) => {
  const { data } = await apiClient.post('/configuracion/validar-cierre', { password })
  return data
}

export const cambiarCierrePassword = async (passwordActual, passwordNueva) => {
  const { data } = await apiClient.put('/configuracion/cierre-password', { passwordActual, passwordNueva })
  return data
}