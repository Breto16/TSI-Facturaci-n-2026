const Factura = require('../models/factura')
const FacturaItem = require('../models/facturaItem')
const { emitirMesasActualizadas } = require('../sockets/io')

const getFacturasPorMesa = async (req, res) => {
  const { mesaId } = req.params
  try {
    const facturas = await Factura.listarPorMesa(mesaId)
    res.json(facturas)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const postFactura = async (req, res) => {
  const { mesa_id } = req.body

  if (mesa_id == null) {
    return res.status(400).json({ msg: 'mesa_id es obligatorio' })
  }

  try {
    const factura = await Factura.crear(mesa_id)
    emitirMesasActualizadas()
    res.json(factura)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const getFactura = async (req, res) => {
  const { id } = req.params
  try {
    const factura = await Factura.obtenerPorId(id)
    if (!factura) return res.status(404).json({ msg: 'Factura no existe' })
    res.json(factura)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const getFacturas = async (req, res) => {
  const { estados, fechaDesde, fechaHasta, pagina = 1 } = req.query
  const LIMIT = 20

  try {
    const resultado = await Factura.listarPaginado({
      estados: estados ? estados.split(',') : null,
      fechaDesde: fechaDesde || null,
      fechaHasta: fechaHasta || null,
      pagina: parseInt(pagina),
      limit: LIMIT,
    })
    res.json({ ...resultado, pagina: parseInt(pagina), limit: LIMIT })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}


const putFacturaEncabezado = async (req, res) => {
  const { id } = req.params
  const { mesa_id, salonero_id, detalle } = req.body
  try {
    const factura = await Factura.actualizarEncabezado(id, { mesa_id, salonero_id, detalle })
    if (!factura) return res.status(404).json({ msg: 'Factura no existe' })
    emitirMesasActualizadas()
    res.json(factura)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const putFacturaEstado = async (req, res) => {
  const { id } = req.params
  const { estado, tipo_pago, monto_recibido, cambio } = req.body
  try {
    const factura = await Factura.actualizarEstado(id, estado, { tipo_pago, monto_recibido, cambio })
    if (!factura) return res.status(404).json({ msg: 'Factura no existe' })
    emitirMesasActualizadas()
    res.json(factura)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const putTotales = async (req, res) => {
  const { id } = req.params
  const { descuento, cobrar_servicio, tiene_trucha, trucha_gramos, trucha_precio_gramo, trucha_total } = req.body

  try {
    const datosTrucha = tiene_trucha !== undefined ? {
      tieneTrucha: tiene_trucha,
      gramos: trucha_gramos || null,
      precioGramo: trucha_precio_gramo || null,
      total: trucha_total || null,
    } : null

    const factura = await Factura.recalcularTotales(id, descuento, cobrar_servicio !== false, datosTrucha)
    res.json(factura)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const getItems = async (req, res) => {
  const { id } = req.params
  try {
    const items = await FacturaItem.listarPorFactura(id)
    res.json(items)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const postItem = async (req, res) => {
  const { id } = req.params
  const { producto_id, descripcion, precio_unitario, cantidad } = req.body
  try {
    const item = await FacturaItem.agregarOIncrementar({
      factura_id: id, producto_id, descripcion, precio_unitario, cantidad
    })
    await Factura.recalcularTotales(id)
    res.json(item)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const putItem = async (req, res) => {
  const { id, itemId } = req.params
  const { cantidad } = req.body
  try {
    if (cantidad <= 0) {
      await FacturaItem.eliminar(itemId)
    } else {
      await FacturaItem.actualizar(itemId, cantidad)
    }
    await Factura.recalcularTotales(id)
    const factura = await Factura.obtenerPorId(id)
    res.json(factura)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const deleteItem = async (req, res) => {
  const { id, itemId } = req.params
  try {
    await FacturaItem.eliminar(itemId)
    await Factura.recalcularTotales(id)
    const factura = await Factura.obtenerPorId(id)
    res.json(factura)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const postHija = async (req, res) => {
  const { id } = req.params
  try {
    const padre = await Factura.obtenerPorId(id)
    if (!padre) return res.status(404).json({ msg: 'Factura padre no existe' })

    const hija = await Factura.crearHija(id, padre.mesa_id, padre.salonero_id)
    emitirMesasActualizadas()
    res.json(hija)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const getHijas = async (req, res) => {
  const { id } = req.params
  try {
    const hijas = await Factura.listarHijas(id)
    res.json(hijas)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const moverItems = async (req, res) => {
  const { id } = req.params
  const { tipo, itemId, facturaDestinoId } = req.body

  try {
    await Factura.moverItemsTransaccion(id, facturaDestinoId, tipo, itemId)

    const [itemsPadre, itemsDestino] = await Promise.all([
      FacturaItem.listarPorFactura(id),
      FacturaItem.listarPorFactura(facturaDestinoId),
    ])

    res.json({ itemsPadre, itemsDestino })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: error.message || 'Error en el servidor' })
  }
}
const putTruchasPendientes = async (req, res) => {
  const { id } = req.params
  const { cantidad } = req.body
  try {
    const factura = await Factura.actualizarTruchasPendientes(id, cantidad)
    res.json(factura)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}
module.exports = {
  getFacturasPorMesa, postFactura, getFactura, getFacturas,
  putFacturaEncabezado, putFacturaEstado, putTotales,
  getItems, postItem, putItem, deleteItem,
  postHija, getHijas, moverItems, putTruchasPendientes
}



