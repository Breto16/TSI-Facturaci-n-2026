const { Router } = require('express')
const {
  postVentaProductos,
  postServicioSalonero,
  getConsultasRapidas,
  postConsultaRapida,
  deleteConsultaRapida,
  getCierre,
  postCierre,
} = require('../controllers/consultas')
const { validarJWT } = require('../middlewares/validarJWT')

const router = Router()
router.use(validarJWT)

router.post('/venta-productos', postVentaProductos)
router.post('/servicio-salonero', postServicioSalonero)
router.get('/rapidas', getConsultasRapidas)
router.post('/rapidas', postConsultaRapida)
router.delete('/rapidas/:id', deleteConsultaRapida)
router.get('/cierre', getCierre)
router.post('/cierre', postCierre)

module.exports = router