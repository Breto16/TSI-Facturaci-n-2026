const { Router } = require('express')
const { postValidarCierre, putCierrePassword } = require('../controllers/configuracion')
const { validarJWT } = require('../middlewares/validarJWT')

const router = Router()
router.use(validarJWT)

router.post('/validar-cierre', postValidarCierre)
router.put('/cierre-password', putCierrePassword)

module.exports = router