const { Router } = require('express')
const { postImprimir, postCaja, postImprimirCierre  } = require('../controllers/impresion')
const { validarJWT } = require('../middlewares/validarJWT')

const router = Router()
router.use(validarJWT)

router.post('/facturas/:id', postImprimir)
router.post('/caja', postCaja)
router.post('/cierre', postImprimirCierre)

module.exports = router