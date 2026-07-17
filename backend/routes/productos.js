const { Router } = require('express');
const {
  getProductos,
  getProducto,
  postProducto,
  putProducto,
  deleteProducto,
  getProductosParaConsultas,
  getVariantes,
  postVariante,
  deleteVariante,
} = require('../controllers/productos');
const { validarJWT } = require('../middlewares/validarJWT');

const router = Router();

router.use(validarJWT);

router.get('/', getProductos);
router.get('/consultas/listar', getProductosParaConsultas)
router.get('/:id', getProducto);
router.post('/', postProducto);
router.put('/:id', putProducto);
router.delete('/:id', deleteProducto);

router.get('/:id/variantes', getVariantes)
router.post('/:id/variantes', postVariante)
router.delete('/variantes/:varianteId', deleteVariante)

module.exports = router;