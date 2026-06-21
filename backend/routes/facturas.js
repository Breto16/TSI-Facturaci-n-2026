const { Router } = require('express')
const {
  getFacturasPorMesa, postFactura, getFactura, getFacturas,
  putFacturaEncabezado, putFacturaEstado, putTotales,
  getItems, postItem, putItem, deleteItem,
  postHija, getHijas, moverItems, putTruchasPendientes
} = require('../controllers/facturas')
const { validarJWT } = require('../middlewares/validarJWT')

const router = Router()
router.use(validarJWT)

router.get('/', getFacturas)
router.get('/mesa/:mesaId', getFacturasPorMesa)
router.get('/:id', getFactura)
router.post('/', postFactura)
router.put('/:id/encabezado', putFacturaEncabezado)
router.put('/:id/estado', putFacturaEstado)
router.put('/:id/totales', putTotales)
router.get('/:id/items', getItems)
router.post('/:id/items', postItem)
router.put('/:id/items/:itemId', putItem)
router.delete('/:id/items/:itemId', deleteItem)
router.get('/:id/hijas', getHijas)
router.post('/:id/hijas', postHija)
router.post('/:id/mover', moverItems)
router.put('/:id/truchas-pendientes', putTruchasPendientes)


module.exports = router