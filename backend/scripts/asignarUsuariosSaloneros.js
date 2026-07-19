const bcrypt = require('bcryptjs')
const pool = require('../db/connection')
require('dotenv').config()

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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '') || 'salonero'
}

const buscarUsuarioExistente = async (usuario) => {
  const { rows } = await pool.query('SELECT id FROM usuarios WHERE usuario = $1', [usuario])
  return rows[0]
}

const generarUsuarioDisponible = async (nombreCompleto) => {
  const base = generarUsuarioBase(nombreCompleto)
  let candidato = base
  let sufijo = 1

  while (await buscarUsuarioExistente(candidato)) {
    sufijo += 1
    candidato = `${base}${sufijo}`
  }

  return candidato
}

async function main() {
  const { rows: saloneros } = await pool.query(
    `SELECT id, nombre FROM saloneros WHERE usuario_id IS NULL ORDER BY id`
  )

  console.log(`Encontrados ${saloneros.length} saloneros sin usuario de acceso.`)

  for (const s of saloneros) {
    const usuarioGenerado = await generarUsuarioDisponible(s.nombre)
    const passwordHash = bcrypt.hashSync(`${Date.now()}${Math.random()}`, bcrypt.genSaltSync())

    const { rows: nuevoUsuario } = await pool.query(
      `INSERT INTO usuarios (nombre, usuario, password_hash, rol)
       VALUES ($1, $2, $3, 'salonero')
       RETURNING id`,
      [s.nombre, usuarioGenerado, passwordHash]
    )

    await pool.query(
      `UPDATE saloneros SET usuario_id = $1 WHERE id = $2`,
      [nuevoUsuario[0].id, s.id]
    )

    console.log(`  ${s.nombre} → usuario: ${usuarioGenerado}`)
  }

  console.log('Listo.')
  await pool.end()
}

main().catch(err => {
  console.error('Error asignando usuarios:', err)
  process.exit(1)
})