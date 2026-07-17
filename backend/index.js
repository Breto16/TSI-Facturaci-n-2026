const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

const pool = require('./db/connection');
const { initSocket } = require('./sockets/io');

const usuariosRoutes = require('./routes/usuarios');
const productosRoutes = require('./routes/productos');
const truchaRoutes = require('./routes/trucha')
const mesasRoutes = require('./routes/mesas')
const facturasRoutes = require('./routes/facturas')
const salonerosRoutes = require('./routes/saloneros')
const impresionRoutes = require('./routes/impresion')
const consultasRoutes = require('./routes/consultas')
const configuracionRoutes = require('./routes/configuracion')
const comandasRoutes = require('./routes/comandas')


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.use(express.json());

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/trucha', truchaRoutes)
app.use('/api/mesas', mesasRoutes)
app.use('/api/productos', productosRoutes);
app.use('/api/facturas', facturasRoutes)
app.use('/api/saloneros', salonerosRoutes)
app.use('/api/imprimir', impresionRoutes)
app.use('/api/consultas', consultasRoutes)
app.use('/api/configuracion', configuracionRoutes)
app.use('/api/comandas', comandasRoutes)

// Sirve el frontend ya compilado (frontend/dist) para que todo corra
// desde un único proceso y un único puerto, sin importar la IP de la red.
const frontendPath = path.join(__dirname, '../frontend/dist')
app.use(express.static(frontendPath))

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

pool.query('SELECT NOW()')
  .then(() => console.log('BD CONECTADA'))
  .catch((err) => {
    console.log(err);
    console.log('No se pudo conectar a la BD');
  });

const server = http.createServer(app)
initSocket(server)

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});