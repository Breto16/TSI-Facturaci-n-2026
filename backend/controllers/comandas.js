const Comanda = require('../models/comanda')
const Producto = require('../models/producto')
const Factura = require('../models/factura')
const FacturaItem = require('../models/facturaItem')
const {
  emitirComandaNueva,
  emitirItemActualizado,
  emitirFacturaActualizada,
  emitirItemEliminado,
  emitirComandaVaciada,
} = require('../sockets/io')
const { imprimirComandaCocina, imprimirComandaCaja } = require('../models/impresion')

const postComanda = async (req, res) => {
  const { mesaId, saloneroId, facturaId, items, ficha, imprimirSalon } = req.body

  if (!mesaId || !facturaId || !items || items.length === 0) {
    return res.status(400).json({ msg: 'La mesa, la factura y al menos un producto son obligatorios' })
  }

  try {
    const comanda = await Comanda.crear({ mesaId, saloneroId, facturaId, items, ficha, imprimirSalon })

    const productoIds = [...new Set(items.map(i => i.productoId).filter(Boolean))]
    if (productoIds.length > 0) {
      const productos = await Producto.obtenerVariosPorId(productoIds)
      const productoPorId = Object.fromEntries(productos.map(p => [p.id, p]))

      let truchasSum = 0
      for (const item of items) {
        const producto = productoPorId[item.productoId]
        if (!producto) continue

        if (producto.requiere_ficha) {
          truchasSum += item.cantidad
        } else {
          await FacturaItem.agregarOIncrementar({
            factura_id: facturaId,
            producto_id: producto.id,
            descripcion: producto.descripcion,
            precio_unitario: producto.precio,
            cantidad: item.cantidad,
          })
        }
      }

      if (truchasSum > 0) {
        await Factura.incrementarTruchasPendientes(facturaId, truchasSum)
      }
      await Factura.recalcularTotales(facturaId)
      emitirFacturaActualizada(facturaId)
    }

    const comandaCompleta = await Comanda.obtenerPorId(comanda.id)
    emitirComandaNueva(comandaCompleta)
    res.json(comanda)

    imprimirComandaCocina(comanda.id).catch(err =>
      console.log('No se pudo imprimir ticket de cocina:', err.message)
    )
    if (imprimirSalon) {
      imprimirComandaCaja(comanda.id).catch(err =>
        console.log('No se pudo imprimir ticket de salón:', err.message)
      )
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const getComandasPorFactura = async (req, res) => {
  const { facturaId } = req.params
  try {
    const comandas = await Comanda.listarPorFactura(facturaId)
    res.json(comandas)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const getComandasActivas = async (req, res) => {
  try {
    const comandas = await Comanda.listarActivas()
    res.json(comandas)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const putItemDespachado = async (req, res) => {
  const { id } = req.params
  const { despachado } = req.body

  try {
    const item = await Comanda.marcarItemDespachado(id, despachado !== false)
    if (!item) return res.status(404).json({ msg: 'Item no existe' })
    emitirItemActualizado(item)
    res.json(item)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const putTodoTipoDespachado = async (req, res) => {
  const { id } = req.params
  const { categoria } = req.body

  if (!['cocina', 'salon'].includes(categoria)) {
    return res.status(400).json({ msg: 'Categoría inválida' })
  }

  try {
    const items = await Comanda.marcarTodoTipoDespachado(id, categoria)
    items.forEach(emitirItemActualizado)
    res.json(items)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const deleteItemComanda = async (req, res) => {
  const { itemId } = req.params
  try {
    await Comanda.eliminarItem(itemId)
    emitirItemEliminado(itemId)
    res.json({ msg: 'Item eliminado de la comanda' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const deleteTodosItemsComanda = async (req, res) => {
  const { id } = req.params
  try {
    await Comanda.eliminarTodosItems(id)
    emitirComandaVaciada(id)
    res.json({ msg: 'Comanda vaciada' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const postReimprimir = async (req, res) => {
  const { id } = req.params
  const { tipo } = req.body

  try {
    if (tipo === 'cocina') {
      await imprimirComandaCocina(id)
    } else if (tipo === 'salon') {
      await imprimirComandaCaja(id)
    } else {
      return res.status(400).json({ msg: 'Tipo inválido' })
    }
    res.json({ msg: 'Reimpresión enviada' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'No se pudo reimprimir', detalle: error.message })
  }
}

module.exports = {
  postComanda,
  getComandasPorFactura,
  getComandasActivas,
  putItemDespachado,
  putTodoTipoDespachado,
  deleteItemComanda,
  deleteTodosItemsComanda,
  postReimprimir,
}