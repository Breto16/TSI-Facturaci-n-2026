const { Router } = require('express');
const { login, getUsuarios, postUsuario, putUsuario } = require('../controllers/usuarios');
const { validarJWT } = require('../middlewares/validarJWT');
const { validarAdmin } = require('../middlewares/validarAdmin');

const router = Router();

router.post('/login', login);

router.get('/', [validarJWT, validarAdmin], getUsuarios);
router.post('/', [validarJWT, validarAdmin], postUsuario);
router.put('/:id', [validarJWT, validarAdmin], putUsuario);

module.exports = router;