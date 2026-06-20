const Consulta = require('../models/consulta')

const postVentaProductos = async (req, res) => {
  const { productoIds, fechaDesde, fechaHasta } = req.body

  if (!productoIds || productoIds.length === 0) {
    return res.status(400).json({ msg: 'Seleccioná al menos un producto' })
  }
  if (!fechaDesde || !fechaHasta) {
    return res.status(400).json({ msg: 'El rango de fechas es obligatorio' })
  }

  try {
    const resultado = await Consulta.ventaPorProductos(productoIds, fechaDesde, fechaHasta)
    res.json(resultado)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const postServicioSalonero = async (req, res) => {
  const { saloneroId, fechaDesde, fechaHasta } = req.body

  if (!saloneroId) {
    return res.status(400).json({ msg: 'Seleccioná un salonero' })
  }
  if (!fechaDesde || !fechaHasta) {
    return res.status(400).json({ msg: 'El rango de fechas es obligatorio' })
  }

  try {
    const resultado = await Consulta.servicioPorSalonero(saloneroId, fechaDesde, fechaHasta)
    res.json(resultado)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const getConsultasRapidas = async (req, res) => {
  try {
    const consultas = await Consulta.listarConsultasRapidas()
    res.json(consultas)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const postConsultaRapida = async (req, res) => {
  const { titulo, productoIds } = req.body

  if (!titulo || !titulo.trim()) {
    return res.status(400).json({ msg: 'El título es obligatorio' })
  }
  if (!productoIds || productoIds.length === 0) {
    return res.status(400).json({ msg: 'Seleccioná al menos un producto' })
  }

  try {
    const consulta = await Consulta.crearConsultaRapida(titulo.trim(), productoIds)
    res.json(consulta)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const deleteConsultaRapida = async (req, res) => {
  const { id } = req.params
  try {
    await Consulta.eliminarConsultaRapida(id)
    res.json({ msg: 'Consulta eliminada' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const getCierre = async (req, res) => {
  const { fechaDesde, fechaHasta } = req.query

  if (!fechaDesde || !fechaHasta) {
    return res.status(400).json({ msg: 'El rango de fechas es obligatorio' })
  }

  try {
    const [totales, servicios] = await Promise.all([
      Consulta.totalesCierre(fechaDesde, fechaHasta),
      Consulta.serviciosPorTodosSaloneros(fechaDesde, fechaHasta),
    ])
    res.json({ totales, servicios })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const postCierre = async (req, res) => {
  const { fecha, totalSistema, totalEfectivoContado, totalTarjetaDatafono } = req.body

  if (!fecha || totalSistema == null) {
    return res.status(400).json({ msg: 'Datos incompletos para el cierre' })
  }

  const totalContado = (Number(totalEfectivoContado) || 0) + (Number(totalTarjetaDatafono) || 0)
  const diferencia = totalContado - Number(totalSistema)

  try {
    const cierre = await Consulta.guardarCierre({
      fecha,
      totalSistema,
      totalEfectivoContado,
      totalTarjetaDatafono,
      diferencia,
      creadoPor: req.uid,
    })
    res.json(cierre)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

module.exports = {
  postVentaProductos,
  postServicioSalonero,
  getConsultasRapidas,
  postConsultaRapida,
  deleteConsultaRapida,
  getCierre,
  postCierre,
}
