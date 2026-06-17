const { Router } = require('express')
const { getVigente, putVigente } = require('../controllers/trucha')
const { validarJWT } = require('../middlewares/validarJWT')

const router = Router()

router.use(validarJWT)

router.get('/vigente', getVigente)
router.put('/vigente', putVigente)

module.exports = router