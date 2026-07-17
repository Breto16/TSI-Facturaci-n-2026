const { Router } = require('express')
const {
  postComanda,
  getComandasPorFactura,
  getComandasActivas,
  putItemDespachado,
  putTodoTipoDespachado,
} = require('../controllers/comandas')
const { validarJWT } = require('../middlewares/validarJWT')

const router = Router()
router.use(validarJWT)

router.post('/', postComanda)
router.get('/activas', getComandasActivas)
router.get('/factura/:facturaId', getComandasPorFactura)
router.put('/items/:id/despachar', putItemDespachado)
router.put('/:id/despachar-tipo', putTodoTipoDespachado)

module.exports = router