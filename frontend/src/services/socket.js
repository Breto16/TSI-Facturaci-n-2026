import { io } from 'socket.io-client'

const socketUrl = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
  : window.location.origin

export const socket = io(socketUrl, {
  autoConnect: false,
})