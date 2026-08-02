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

// Certificados generados con mkcert, necesarios para HTTPS en la LAN local.
const certPath = path.join(__dirname, 'certs')
const certFiles = fs.readdirSync(certPath)
const keyFile = certFiles.find(f => f.endsWith('-key.pem'))
const certFile = certFiles.find(f => f.endsWith('.pem') && !f.endsWith('-key.pem'))

if (!keyFile || !certFile) {
  throw new Error('No se encontraron certificados en ./certs, no se puede iniciar HTTPS')
}

const httpsOptions = {
  key: fs.readFileSync(path.join(certPath, keyFile)),
  cert: fs.readFileSync(path.join(certPath, certFile)),
}

// Servidor HTTPS: el unico que sirve la aplicacion real.
const httpsServer = https.createServer(httpsOptions, app)
initSocket(httpsServer)

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`Servidor HTTPS corriendo en puerto ${HTTPS_PORT}`);
});

// Servidor HTTP: no sirve la app, solo redirige a HTTPS.
// Cubre el caso de alguien escribiendo la URL vieja sin "https://".
const redirectApp = express()
redirectApp.use((req, res) => {
  res.redirect(`https://${req.hostname}:${HTTPS_PORT}${req.url}`)
})

http.createServer(redirectApp).listen(HTTP_PORT, () => {
  console.log(`Servidor HTTP (solo redireccion) corriendo en puerto ${HTTP_PORT}`);
});