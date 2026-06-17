const { Router } = require('express')
const { getSaloneros, postSalonero, putSalonero } = require('../controllers/saloneros')
const { validarJWT } = require('../middlewares/validarJWT')

const router = Router()
router.use(validarJWT)

router.get('/', getSaloneros)
router.post('/', postSalonero)
router.put('/:id', putSalonero)

module.exports = router