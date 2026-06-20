const { imprimirFactura, abrirCajaRegistradora, imprimirCierre } = require('../models/impresion')


const postImprimir = async (req, res) => {
  const { id } = req.params
  try {
    await imprimirFactura(id)
    res.json({ msg: 'Factura enviada a impresora' })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: 'No se pudo imprimir',
      detalle: error.message,
      sinImpresora: error.message?.includes('not found') || error.message?.includes('LIBUSB')
    })
  }
}

const postCaja = async (req, res) => {
  try {
    await abrirCajaRegistradora()
    res.json({ msg: 'Caja abierta' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'No se pudo abrir la caja', detalle: error.message })
  }
}



const postImprimirCierre = async (req, res) => {
  try {
    await imprimirCierre(req.body)
    res.json({ msg: 'Cierre enviado a impresora' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'No se pudo imprimir el cierre', detalle: error.message })
  }
}

module.exports = { postImprimir, postCaja, postImprimirCierre }