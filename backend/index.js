const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db/connection');
const usuariosRoutes = require('./routes/usuarios');
const productosRoutes = require('./routes/productos');
const truchaRoutes = require('./routes/trucha')
const mesasRoutes = require('./routes/mesas')
const facturasRoutes = require('./routes/facturas')
const salonerosRoutes = require('./routes/saloneros')
const impresionRoutes = require('./routes/impresion')
const consultasRoutes = require('./routes/consultas')
const configuracionRoutes = require('./routes/configuracion')


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.use(express.json());




app.get('/', (req, res) => {
  res.json({ msg: 'API TSI Facturación funcionando' });
});

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/trucha', truchaRoutes)
app.use('/api/mesas', mesasRoutes)
app.use('/api/productos', productosRoutes);
app.use('/api/facturas', facturasRoutes)
app.use('/api/saloneros', salonerosRoutes)
app.use('/api/imprimir', impresionRoutes)
app.use('/api/consultas', consultasRoutes)
app.use('/api/configuracion', configuracionRoutes)

pool.query('SELECT NOW()')
  .then(() => console.log('BD CONECTADA'))
  .catch((err) => {
    console.log(err);
    console.log('No se pudo conectar a la BD');
  });

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});