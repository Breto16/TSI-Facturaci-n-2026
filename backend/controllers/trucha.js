const Trucha = require('../models/trucha')

const getVigente = async (req, res) => {
  try {
    const precio = await Trucha.obtenerVigente()
    res.json(precio || null)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const putVigente = async (req, res) => {
  const { precio_gramo } = req.body

  if (!precio_gramo || isNaN(precio_gramo) || Number(precio_gramo) <= 0) {
    return res.status(400).json({ msg: 'Precio por gramo inválido' })
  }

  try {
    const actualizado = await Trucha.actualizarVigente(Number(precio_gramo))
    res.json(actualizado)
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

module.exports = { getVigente, putVigente }