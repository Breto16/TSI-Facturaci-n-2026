const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
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
const HTTPS_PORT = process.env.HTTPS_PORT || 4443;
const HTTP_PORT = process.env.PORT || 4000;

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

// Certificados generados con mkcert, necesarios para HTTPS en la LAN local de producción.
const certPath = path.join(__dirname, 'certs')
let hasCerts = false
let httpsOptions = null

if (fs.existsSync(certPath)) {
  try {
    const certFiles = fs.readdirSync(certPath)
    const keyFile = certFiles.find(f => f.endsWith('-key.pem'))
    const certFile = certFiles.find(f => f.endsWith('.pem') && !f.endsWith('-key.pem'))
    if (keyFile && certFile) {
      httpsOptions = {
        key: fs.readFileSync(path.join(certPath, keyFile)),
        cert: fs.readFileSync(path.join(certPath, certFile)),
      }
      hasCerts = true
    }
  } catch (err) {
    console.warn('Advertencia al leer certificados SSL:', err.message)
  }
}

if (hasCerts && httpsOptions) {
  // Servidor HTTPS: el único que sirve la aplicación en producción con SSL
  const httpsServer = https.createServer(httpsOptions, app)
  initSocket(httpsServer)

  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`Servidor HTTPS corriendo en puerto ${HTTPS_PORT}`)
  })

  // Servidor HTTP: redirige a HTTPS en producción
  const redirectApp = express()
  redirectApp.use((req, res) => {
    res.redirect(`https://${req.hostname}:${HTTPS_PORT}${req.url}`)
  })

  http.createServer(redirectApp).listen(HTTP_PORT, () => {
    console.log(`Servidor HTTP (solo redirección) corriendo en puerto ${HTTP_PORT}`)
  })
} else {
  // Modo desarrollo / sin certificados: sirve la aplicación directamente por HTTP
  console.log('Modo desarrollo (sin certificados SSL): Servidor corriendo directamente en HTTP')
  const httpServer = http.createServer(app)
  initSocket(httpServer)

  httpServer.listen(HTTP_PORT, () => {
    console.log(`Servidor HTTP corriendo en puerto ${HTTP_PORT}`)
  })
}
