const Salonero = require('../models/salonero')

const getSaloneros = async (req, res) => {
  try {
    const saloneros = await Salonero.listar()
    res.json(saloneros)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const postSalonero = async (req, res) => {
  const { nombre } = req.body
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ msg: 'El nombre es obligatorio' })
  }
  try {
    const salonero = await Salonero.crear(nombre.trim())
    res.json(salonero)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const putSalonero = async (req, res) => {
  const { id } = req.params
  const { disponible } = req.body
  try {
    const salonero = await Salonero.toggleDisponible(id, disponible)
    if (!salonero) return res.status(404).json({ msg: 'Salonero no existe' })
    res.json(salonero)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

module.exports = { getSaloneros, postSalonero, putSalonero }