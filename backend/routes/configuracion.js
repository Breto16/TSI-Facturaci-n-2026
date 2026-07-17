const { Router } = require('express')
const { postValidarCierre, putCierrePassword, getPinSalonero, putPinSalonero } = require('../controllers/configuracion')
const { validarJWT } = require('../middlewares/validarJWT')

const router = Router()
router.use(validarJWT)

router.post('/validar-cierre', postValidarCierre)
router.put('/cierre-password', putCierrePassword)
router.get('/pin-salonero', getPinSalonero)
router.put('/pin-salonero', putPinSalonero)

module.exports = router