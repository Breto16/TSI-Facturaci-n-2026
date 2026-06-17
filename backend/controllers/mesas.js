const Mesa = require('../models/mesa')

const getConEstado = async (req, res) => {
  try {
    const mesas = await Mesa.listarConEstado()
    console.log('Estados de mesas:', mesas.map(m => ({ id: m.id, estado: m.estado, facturas_activas: m.facturas_activas })))

    res.json(mesas)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const getMesas = async (req, res) => {
  try {
    const mesas = await Mesa.listar()
    res.json(mesas)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

module.exports = { getConEstado, getMesas }