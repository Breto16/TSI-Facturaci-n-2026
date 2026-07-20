const { Server } = require('socket.io')

let io = null

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' },
  })

  io.on('connection', (socket) => {
    console.log('Cliente conectado por socket:', socket.id)
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id)
    })
  })

  return io
}

const emitirComandaNueva = (comanda) => {
  io?.emit('comanda:nueva', comanda)
}

const emitirItemActualizado = (item) => {
  io?.emit('comanda-item:actualizado', item)
}

const emitirMesasActualizadas = () => {
  io?.emit('mesas:actualizar')
}

const emitirFacturaActualizada = (facturaId) => {
  io?.emit('factura:actualizar', { facturaId })
}

const emitirItemEliminado = (itemId) => {
  io?.emit('comanda-item:eliminado', { itemId })
}

const emitirComandaVaciada = (comandaId) => {
  io?.emit('comanda:vaciada', { comandaId })
}

module.exports = { initSocket, emitirComandaNueva, emitirItemActualizado, emitirMesasActualizadas, emitirFacturaActualizada, emitirItemEliminado, emitirComandaVaciada }