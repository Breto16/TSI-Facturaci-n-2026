const bcrypt = require('bcryptjs')
const Salonero = require('../models/salonero')
const Usuario = require('../models/usuario')

const generarUsuarioBase = (nombreCompleto) => {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean)

  let base
  if (partes.length === 1) {
    base = partes[0]
  } else {
    base = partes[0][0] + partes[partes.length - 1]
  }

  return base
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9]/g, '') || 'salonero'
}

const generarUsuarioDisponible = async (nombreCompleto) => {
  const base = generarUsuarioBase(nombreCompleto)
  let candidato = base
  let sufijo = 1

  while (await Usuario.buscarPorUsuario(candidato)) {
    sufijo += 1
    candidato = `${base}${sufijo}`
  }

  return candidato
}

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

    const usuarioGenerado = await generarUsuarioDisponible(nombre.trim())
    // El password_hash no se usa nunca para rol='salonero' (login valida contra el PIN genérico),
    // pero la columna es NOT NULL, así que se llena con un valor de relleno.
    const passwordHash = bcrypt.hashSync(`${Date.now()}${Math.random()}`, bcrypt.genSaltSync())

    const usuario = await Usuario.crear({
      nombre: nombre.trim(),
      usuario: usuarioGenerado,
      passwordHash,
      rol: 'salonero',
    })

    await Salonero.vincularUsuario(salonero.id, usuario.id)

    res.json({ ...salonero, usuario_login: usuarioGenerado })
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