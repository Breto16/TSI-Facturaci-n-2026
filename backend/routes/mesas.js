const { Router } = require('express')
const { getConEstado, getMesas } = require('../controllers/mesas')
const { validarJWT } = require('../middlewares/validarJWT')


const router = Router()

router.use(validarJWT)

router.get('/estado', getConEstado)
router.get('/', getMesas)

module.exports = router