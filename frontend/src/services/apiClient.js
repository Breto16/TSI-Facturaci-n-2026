import axios from 'axios'

// En desarrollo (npm run dev) se usa la URL explícita del .env, porque el frontend
// corre en un puerto distinto al backend (servidor de Vite vs Express).
// En producción (build final), el mismo Express sirve frontend y backend juntos,
// así que basta una ruta relativa: no importa la IP ni la red donde se ejecute.
const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? import.meta.env.VITE_API_URL : '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['x-token'] = token
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient