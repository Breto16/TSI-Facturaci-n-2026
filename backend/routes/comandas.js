const { Router } = require('express')
const {
  postComanda,
  postAgregarItems,
  putItemCancelado,
  putItemCantidad,
  getComandasPorFactura,
  getComandasActivas,
  putItemDespachado,
  putTodoTipoDespachado,
  deleteItemComanda,
  deleteTodosItemsComanda,
  postReimprimir,
} = require('../controllers/comandas')
const { validarJWT } = require('../middlewares/validarJWT')

const router = Router()
router.use(validarJWT)

router.post('/', postComanda)
router.get('/activas', getComandasActivas)
router.get('/factura/:facturaId', getComandasPorFactura)
router.post('/:id/items', postAgregarItems)
router.put('/items/:itemId/cancelar', putItemCancelado)
router.put('/items/:itemId/cantidad', putItemCantidad)
router.put('/items/:id/despachar', putItemDespachado)
router.put('/:id/despachar-tipo', putTodoTipoDespachado)
router.delete('/items/:itemId', deleteItemComanda)
router.delete('/:id/items', deleteTodosItemsComanda)
router.post('/:id/reimprimir', postReimprimir)

module.exports = router