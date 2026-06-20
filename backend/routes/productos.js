const { Router } = require('express');
const { getProductos, getProducto, postProducto, putProducto, deleteProducto, getProductosParaConsultas } = require('../controllers/productos');
const { validarJWT } = require('../middlewares/validarJWT');

const router = Router();

router.use(validarJWT);

router.get('/', getProductos);
router.get('/consultas/listar', getProductosParaConsultas)
router.get('/:id', getProducto);
router.post('/', postProducto);
router.put('/:id', putProducto);
router.delete('/:id', deleteProducto);


module.exports = router;