const Configuracion = require('../models/configuracion')

const postValidarCierre = async (req, res) => {
  const { password } = req.body
  try {
    const passwordGuardada = await Configuracion.obtener('cierre_password')
    if (password === passwordGuardada) {
      res.json({ valido: true })
    } else {
      res.status(401).json({ valido: false, msg: 'Contraseña incorrecta' })
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

const putCierrePassword = async (req, res) => {
  const { passwordActual, passwordNueva } = req.body
  try {
    const passwordGuardada = await Configuracion.obtener('cierre_password')
    if (passwordActual !== passwordGuardada) {
      return res.status(401).json({ msg: 'Contraseña actual incorrecta' })
    }
    await Configuracion.actualizar('cierre_password', passwordNueva)
    res.json({ msg: 'Contraseña actualizada' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error en el servidor' })
  }
}

module.exports = { postValidarCierre, putCierrePassword }