const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const pool = require('../db/connection')
const { exec } = require('child_process')

require('dotenv').config()

/* =========================
   OBTENER FACTURA
========================= */
const obtenerDatosFactura = async (facturaId) => {
  const { rows } = await pool.query(`
    SELECT f.*, m.nombre AS mesa_nombre, s.nombre AS salonero_nombre
    FROM facturas f
    LEFT JOIN mesas m ON m.id = f.mesa_id
    LEFT JOIN saloneros s ON s.id = f.salonero_id
    WHERE f.id = $1
  `, [facturaId])

  if (!rows[0]) return null

  const { rows: items } = await pool.query(`
    SELECT descripcion, precio_unitario, cantidad, total
    FROM factura_items
    WHERE factura_id = $1
    ORDER BY id ASC
  `, [facturaId])

  return { ...rows[0], items }
}

/* =========================
   MONEDA
========================= */
const fmt = (monto) => `¢${Number(monto).toLocaleString('es-CR')}`

/* =========================
   CALCULAR ALTO DINÁMICO
========================= */
const calcularAltoDocumento = (factura) => {
  const ALTO_BASE = 320 // header + logo + info factura + totales + footer, con margen extra
  const ALTO_POR_ITEM = 30 // descripcion + precio unitario por item, con margen extra

  let extra = 0
  if (Number(factura.descuento) > 0) extra += 15
  if (factura.tiene_trucha) extra += 30

  const alto = ALTO_BASE + (factura.items.length * ALTO_POR_ITEM) + extra

  // Mínimo de seguridad para facturas muy cortas, máximo razonable para evitar rollos gigantes accidentales
  return Math.max(500, Math.min(alto, 3000))
}

/* =========================
   GENERAR PDF EN RUTA FIJA
========================= */
const generarPDF = async (factura) => {
  const dir = path.join(__dirname, '../assets/facturas')

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const filePath = path.join(dir, `factura_${factura.id}.pdf`)
  const alto = calcularAltoDocumento(factura)

  const doc = new PDFDocument({
    size: [215, alto],
    margins: { top: 0, bottom: 20, left: 0, right: 0 }
  })

  doc.pipe(fs.createWriteStream(filePath))

  doc.registerFont('GSansRegular', path.join(__dirname, '../assets/GoogleSans-Regular.ttf'))
  doc.registerFont('GSansBold', path.join(__dirname, '../assets/GoogleSans-Bold.ttf'))
  doc.registerFont('GSansItalic', path.join(__dirname, '../assets/GoogleSans-MediumItalic.ttf'))

  let y = 10

  /* =========================
     LOGO (si existe)
  ========================= */
  const logoPath = path.join(__dirname, '../assets/LogoTSI.png')
  if (fs.existsSync(logoPath)) {
    const logoWidth = 90
    doc.image(logoPath, (215 - logoWidth) / 2, y, { width: logoWidth })
    y += 70
  }

  /* =========================
     HEADER
  ========================= */
  doc.font('GSansBold')
    .fontSize(15)
    .text('Truchas San Ignacio', 0, y, { align: 'center' })

  y += 18
  doc.fontSize(12)
  doc.text('RESTAURANTE', 0, y, { align: 'center' })
  y += 18

  doc.font('GSansRegular').fontSize(10)

  const headerInfo = [
    process.env.RESTAURANTE_EMAIL,
    process.env.RESTAURANTE_WEB,
    process.env.RESTAURANTE_TEL,
    process.env.RESTAURANTE_DIRECCION,
  ]

  headerInfo.forEach(line => {
    if (line) {
      doc.text(line, 0, y, { align: 'center' })
      y += 10
    }
  })

  y += 8

  /* =========================
     INFO FACTURA
  ========================= */
  const fechaLarga = new Date(factura.fecha_apertura || Date.now())
    .toLocaleString('es-CR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

  const mesaLimpia = (factura.mesa_nombre || '')
    .replace(/mesa/i, '')
    .trim()

  doc.font('GSansRegular').fontSize(10)

  doc.text(`Factura #${factura.id}`, 10, y)
  y += 12

  doc.text(fechaLarga, 10, y)
  y += 12

  doc.text(`Mesa: ${mesaLimpia}`, 10, y)
  y += 12

  doc.text(`Cliente: ${factura.detalle || 'Sin nombre'}`, 10, y)
  y += 17

  doc.moveTo(0, y).lineTo(215, y).stroke()
  y += 8

  /* =========================
     ITEMS
  ========================= */
  for (const item of factura.items) {
    const desc = `${item.cantidad}× ${item.descripcion}`
    const total = fmt(item.total)

    doc.font('GSansRegular').fontSize(12)
    doc.text(desc, 10, y, { width: 130 })
    doc.text(total, 10, y, { width: 195, align: 'right' })

    y += 12

    doc.font('GSansItalic').fontSize(8)
    doc.text(`Precio: ${fmt(item.precio_unitario)}`, 20, y)

    y += 14
  }

  y += 5
  doc.moveTo(0, y).lineTo(215, y).stroke()
  y += 8

  /* =========================
     TOTALES
  ========================= */
  doc.font('GSansRegular').fontSize(12)
  doc.text('Subtotal:', 10, y)
  doc.text(fmt(factura.subtotal), 10, y, { width: 195, align: 'right' })
  y += 17

  doc.text('Servicio 10%:', 10, y)
  doc.text(fmt(factura.servicio), 10, y, { width: 195, align: 'right' })
  y += 17

  if (Number(factura.descuento) > 0) {
    doc.text('Descuento:', 10, y)
    doc.text(`-${fmt(factura.descuento)}`, 10, y, { width: 195, align: 'right' })
    y += 17
  }

  if (factura.tiene_trucha && Number(factura.trucha_gramos) > 0) {

    doc.font('GSansRegular').fontSize(12)
    doc.text(`Trucha (${factura.trucha_gramos}g):`, 10, y)
    doc.text(fmt(factura.trucha_total), 10, y, { width: 195, align: 'right' })
    y += 12

    doc.font('GSansItalic').fontSize(8)
    doc.text(`Precio por kilo: ${fmt(factura.trucha_precio_gramo * 1000)}`, 20, y)
    y += 14
  }


  doc.moveTo(10, y).lineTo(205, y).stroke()
  y += 8


  const totalFinal = Number(factura.total) +
    (factura.tiene_trucha ? Number(factura.trucha_total || 0) : 0)

  doc.font('GSansBold').fontSize(14)
  doc.text('TOTAL:', 10, y)
  doc.text(fmt(totalFinal), 10, y, { width: 195, align: 'right' })

  y += 25

  /* =========================
     MENSAJE FINAL
  ========================= */
  doc.font('GSansRegular').fontSize(10)
  doc.text(
    process.env.RESTAURANTE_MENSAJE || '¡Muchas Gracias por su Visita!',
    0,
    y,
    { align: 'center' }
  )

  doc.end()

  // Esperar a que el stream termine de escribir antes de imprimir
  await new Promise((resolve, reject) => {
    doc.on('end', resolve)
    const stream = fs.createWriteStream(filePath)
    stream.on('finish', resolve)
    stream.on('error', reject)
    setTimeout(resolve, 300) // fallback de seguridad
  })

  return filePath
}

/* =========================
   IMPRIMIR PDF (WINDOWS)
========================= */
const obtenerRutaSumatra = () => {
  let rutaEnv = process.env.SUMATRA_PATH
  if (!rutaEnv) {
    throw new Error('SUMATRA_PATH no está configurado en .env')
  }

  rutaEnv = rutaEnv.replace(/\\\\/g, '\\')

  if (!fs.existsSync(rutaEnv)) {
    throw new Error(`No se encontró SumatraPDF en la ruta configurada: ${rutaEnv}`)
  }
  return rutaEnv
}

const imprimirPDF = async (filePath) => {
  const sumatraPath = obtenerRutaSumatra()
  const printerName = process.env.PRINTER_NAME

  return new Promise((resolve, reject) => {
    const destino = printerName
      ? `-print-to "${printerName}"`
      : '-print-to-default'

    const cmd = `"${sumatraPath}" ${destino} -silent "${filePath}"`

    exec(cmd, (err) => {
      if (err) {
        console.error('Error imprimiendo con SumatraPDF:', err.message)
        return reject(err)
      }
      console.log('Impresión enviada con SumatraPDF')
      resolve()
    })
  })
}

/* =========================
   FUNCIÓN PRINCIPAL
========================= */
const imprimirFactura = async (facturaId) => {
  const factura = await obtenerDatosFactura(facturaId)
  if (!factura) throw new Error('Factura no encontrada')

  const filePath = await generarPDF(factura)
  console.log('PDF generado:', filePath)

  await imprimirPDF(filePath)
  console.log('Enviado a impresión')

  return filePath
}

/* =========================
   APERTURA DE CAJA
========================= */
const ejecutarPowerShell = (comando) => {
  return new Promise((resolve, reject) => {
    exec(`powershell -Command "${comando}"`, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message))
      else resolve(stdout)
    })
  })
}

const abrirCajaRegistradora = async () => {
  if (process.env.CAJA_REGISTRADORA !== 'true') return

  const nombreImpresora = process.env.PRINTER_NAME || 'EPSON TM-T20II Receipt'

  const comando = `
    $printerName = '${nombreImpresora}'
    $bytes = [byte[]](0x1B, 0x70, 0x00, 0x19, 0xFA)
    $enc = [System.Text.Encoding]::GetEncoding('iso-8859-1')
    $str = $enc.GetString($bytes)
    $str | Out-Printer -Name $printerName
  `.replace(/\n/g, '; ').trim()

  try {
    await ejecutarPowerShell(comando)
  } catch (err) {
    console.log('Advertencia: no se pudo abrir la caja:', err.message)
  }
}

const generarPDFCierre = async (datosCierre) => {
  const dir = path.join(__dirname, '../assets/facturas')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const filePath = path.join(dir, `cierre_${Date.now()}.pdf`)

  const altoBase = 280
  const altoServicios = (datosCierre.servicios?.length || 0) * 16
  const altoConsultas = (datosCierre.consultasIncluidas?.length || 0) * 30
  const alto = Math.max(500, altoBase + altoServicios + altoConsultas)

  const doc = new PDFDocument({
    size: [215, alto],
    margins: { top: 0, bottom: 20, left: 0, right: 0 }
  })

  doc.pipe(fs.createWriteStream(filePath))

  doc.registerFont('GSansRegular', path.join(__dirname, '../assets/GoogleSans-Regular.ttf'))
  doc.registerFont('GSansBold', path.join(__dirname, '../assets/GoogleSans-Bold.ttf'))

  let y = 10

  doc.font('GSansBold').fontSize(15).text('Truchas San Ignacio', 0, y, { align: 'center' })
  y += 20
  doc.font('GSansBold').fontSize(13).text('CIERRE DE CAJA', 0, y, { align: 'center' })
  y += 18

  doc.font('GSansRegular').fontSize(9)
  doc.text(new Date().toLocaleString('es-CR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  }), 0, y, { align: 'center' })
  y += 20

  doc.moveTo(0, y).lineTo(215, y).stroke()
  y += 8

  doc.font('GSansRegular').fontSize(11)

  const fila = (label, valor, bold = false) => {
    if (bold) doc.font('GSansBold')
    doc.text(label, 10, y)
    doc.text(valor, 10, y, { width: 195, align: 'right' })
    if (bold) doc.font('GSansRegular')
    y += 14
  }

  fila('Venta Restaurante:', fmt(datosCierre.totalSistema), true)
  fila('Total tarjeta (datáfono):', fmt(datosCierre.totalTarjetaDatafono))
  fila('Total efectivo (sistema):', fmt(datosCierre.totalEfectivoSistema))
  fila('Efectivo contado:', fmt(datosCierre.totalEfectivoContado))

  y += 4
  doc.font('GSansBold')
  doc.text('Diferencia:', 10, y)
  doc.text(fmt(datosCierre.diferencia), 10, y, { width: 195, align: 'right' })
  doc.font('GSansRegular')
  y += 22

  if (datosCierre.servicios && datosCierre.servicios.length > 0) {
    doc.moveTo(0, y).lineTo(215, y).stroke()
    y += 10
    doc.font('GSansBold').fontSize(10).text('SERVICIO 10% POR SALONERO', 0, y, { align: 'center' })
    y += 14
    doc.font('GSansRegular').fontSize(10)

    for (const s of datosCierre.servicios) {
      fila(s.salonero_nombre + ':', fmt(s.total_servicio))
    }
    y += 10
  }

  if (datosCierre.consultasIncluidas && datosCierre.consultasIncluidas.length > 0) {
    doc.moveTo(0, y).lineTo(215, y).stroke()
    y += 10
    doc.font('GSansBold').fontSize(10).text('CONSULTAS ADICIONALES', 0, y, { align: 'center' })
    y += 14
    doc.font('GSansRegular').fontSize(10)

    for (const c of datosCierre.consultasIncluidas) {
      fila(`${c.titulo} (${c.cantidad ?? 0} und.):`, fmt(c.total))
    }
  }

  y += 10
  doc.moveTo(0, y).lineTo(215, y).stroke()
  y += 20

  doc.end()

  await new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath)
    stream.on('finish', resolve)
    setTimeout(resolve, 300)
  })

  return filePath
}

const imprimirCierre = async (datosCierre) => {
  const filePath = await generarPDFCierre(datosCierre)
  await imprimirPDF(filePath)
  return filePath
}

/* =========================
   OBTENER COMANDA
========================= */
const obtenerDatosComanda = async (comandaId) => {
  const { rows } = await pool.query(`
    SELECT c.*, m.nombre AS mesa_nombre, s.nombre AS salonero_nombre, f.detalle AS factura_detalle
    FROM comandas c
    LEFT JOIN mesas m ON m.id = c.mesa_id
    LEFT JOIN saloneros s ON s.id = c.salonero_id
    LEFT JOIN facturas f ON f.id = c.factura_id
    WHERE c.id = $1
  `, [comandaId])

  if (!rows[0]) return null

  const { rows: items } = await pool.query(`
    SELECT descripcion, cantidad, categoria, variante, acompanamiento, detalle, sale_antes
    FROM comanda_items
    WHERE comanda_id = $1
    ORDER BY id ASC
  `, [comandaId])

  return { ...rows[0], items }
}

const ACOMPANAMIENTO_LABEL = {
  yuca: 'Yuca', papa: 'Papa', patacon: 'Patacón', especial: 'Especial', solo: 'Solo(a)',
}

// Tamaños de fuente usados en el cuerpo de la comanda — un solo lugar para
// cambiarlos, tanto la medición como el render real leen de acá.
const FUENTE_ITEM_SIZE_COCINA = 15
const FUENTE_ITEM_SIZE_CAJA = 10
const FUENTE_NOTA_SIZE = 13 // las notas solo se imprimen en cocina, no hace falta variante por tipo

const registrarFuentes = (doc) => {
  doc.registerFont('GSansRegular', path.join(__dirname, '../assets/GoogleSans-Regular.ttf'))
  doc.registerFont('GSansBold', path.join(__dirname, '../assets/GoogleSans-Bold.ttf'))
  doc.registerFont('GSansItalic', path.join(__dirname, '../assets/GoogleSans-MediumItalic.ttf'))
}

const construirLineaItem = (item) => {
  let linea = `${item.cantidad}x ${item.descripcion}`
  if (item.variante) linea += ` (${item.variante})`
  if (item.acompanamiento) linea += ` c/${ACOMPANAMIENTO_LABEL[item.acompanamiento] || item.acompanamiento}`
  return linea
}

// Calcula cuánto espacio ocupa UN ítem (línea + nota si aplica), usando
// heightOfString sobre el mismo doc/fuente que se va a usar para dibujar.
const medirBloqueItem = (doc, item, tipo) => {
  const linea = construirLineaItem(item)
  const tamanoItem = tipo === 'cocina' ? FUENTE_ITEM_SIZE_COCINA : FUENTE_ITEM_SIZE_CAJA

  doc.font('GSansBold').fontSize(tamanoItem)
  let alto = doc.heightOfString(linea, { width: 195 }) + 2

  if (tipo === 'cocina' && item.detalle) {
    doc.font('GSansItalic').fontSize(FUENTE_NOTA_SIZE)
    const notaTexto = `Nota: ${item.detalle}`
    alto += doc.heightOfString(notaTexto, { width: 190 }) + 2
  }

  return alto + 3
}

/* =========================
   CALCULAR ALTO COMANDA (medido, no estimado)
========================= */
const calcularAltoComanda = (items, comanda, tipo, prioridad = false) => {
  const medidor = new PDFDocument({ size: [215, 5000], margins: { top: 0, bottom: 0, left: 0, right: 0 } })
  medidor.pipe(new (require('stream').Writable)({ write(chunk, enc, cb) { cb() } }))
  registrarFuentes(medidor)

  let alto = 8

  alto += 17
  if (prioridad) alto += 16

  if (comanda.factura_detalle) {
    medidor.font('GSansRegular').fontSize(12)
    const textoCliente = `Cliente: ${comanda.factura_detalle}`
    alto += medidor.heightOfString(textoCliente, { width: 195 }) + 2
  }

  if (tipo === 'caja' && comanda.salonero_nombre) {
    alto += 12
  }

  alto += 4

  if (tipo === 'caja') {
    const itemsCocina = items.filter(i => i.categoria === 'cocina')
    const itemsSalon = items.filter(i => i.categoria === 'salon')

    for (const item of itemsCocina) alto += medirBloqueItem(medidor, item, tipo)
    if (itemsCocina.length > 0 && itemsSalon.length > 0) alto += 10
    for (const item of itemsSalon) alto += medirBloqueItem(medidor, item, tipo)
  } else {
    for (const item of items) alto += medirBloqueItem(medidor, item, tipo)
  }

  if (comanda.ficha) alto += 20

  medidor.end()

  return Math.max(230, Math.min(Math.ceil(alto) + 15, 3000))
}

/* =========================
   GENERAR PDF COMANDA
========================= */
const generarPDFComanda = async (comanda, items, tipo, prioridad = false) => {
  const dir = path.join(__dirname, '../assets/facturas')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const sufijo = prioridad ? '_antes' : ''
  const filePath = path.join(dir, `comanda_${comanda.id}_${tipo}${sufijo}.pdf`)
  const alto = calcularAltoComanda(items, comanda, tipo, prioridad)

  const doc = new PDFDocument({
    size: [215, alto],
    margins: { top: 0, bottom: 10, left: 0, right: 0 }
  })

  doc.pipe(fs.createWriteStream(filePath))
  registrarFuentes(doc)

  let y = 8

  const mesaLimpia = (comanda.mesa_nombre || `Mesa ${comanda.mesa_id}`).replace(/mesa/i, '').trim()
  const hora = new Date(comanda.creado_en).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', hour12: true })

  doc.font('GSansBold').fontSize(12)
  doc.text(`Mesa ${mesaLimpia}`, 10, y, { width: 100 })
  doc.text(hora, 10, y, { width: 195, align: 'right' })
  y += 17

  if (prioridad) {
    doc.font('GSansBold').fontSize(13)
    doc.text('SALE ANTES', 0, y, { align: 'center' })
    y += 16
  }

  if (comanda.factura_detalle) {
    doc.font('GSansRegular').fontSize(12)
    const textoCliente = `Cliente: ${comanda.factura_detalle}`
    doc.text(textoCliente, 10, y, { width: 195 })
    y += doc.heightOfString(textoCliente, { width: 195 }) + 2
  }

  if (tipo === 'caja' && comanda.salonero_nombre) {
    doc.font('GSansRegular').fontSize(10)
    doc.text(`Salonero: ${comanda.salonero_nombre}`, 10, y)
    y += 12
  }

  y += 4

  const imprimirItem = (item) => {
    const linea = construirLineaItem(item)
    const tamanoItem = tipo === 'cocina' ? FUENTE_ITEM_SIZE_COCINA : FUENTE_ITEM_SIZE_CAJA

    doc.font('GSansBold').fontSize(tamanoItem)
    doc.text(linea, 10, y, { width: 195 })
    y += doc.heightOfString(linea, { width: 195 }) + 2

    if (tipo === 'cocina' && item.detalle) {
      doc.font('GSansItalic').fontSize(FUENTE_NOTA_SIZE)
      const notaTexto = `Nota: ${item.detalle}`
      doc.text(notaTexto, 15, y, { width: 190 })
      y += doc.heightOfString(notaTexto, { width: 190 }) + 2
    }

    y += 3
  }

  if (tipo === 'caja') {
    const itemsCocina = items.filter(i => i.categoria === 'cocina')
    const itemsSalon = items.filter(i => i.categoria === 'salon')

    itemsCocina.forEach(imprimirItem)

    if (itemsCocina.length > 0 && itemsSalon.length > 0) {
      y += 2
      doc.moveTo(0, y).lineTo(215, y).stroke()
      y += 8
    }

    itemsSalon.forEach(imprimirItem)
  } else {
    items.forEach(imprimirItem)
  }

  if (comanda.ficha) {
    y += 6
    doc.font('GSansBold').fontSize(11)
    doc.text(comanda.ficha, 0, y, { align: 'center' })
    y += 14
  }

  doc.end()

  await new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath)
    stream.on('finish', resolve)
    setTimeout(resolve, 300)
  })

  return filePath
}

/* =========================
   FUNCIONES PRINCIPALES
========================= */
const imprimirComandaCocina = async (comandaId) => {
  const comanda = await obtenerDatosComanda(comandaId)
  if (!comanda) throw new Error('Comanda no encontrada')

  const itemsCocina = comanda.items.filter(i => i.categoria === 'cocina')
  const itemsPrioridad = itemsCocina.filter(i => i.sale_antes)
  const itemsNormales = itemsCocina.filter(i => !i.sale_antes)

  if (itemsPrioridad.length > 0) {
    const filePathPrioridad = await generarPDFComanda(comanda, itemsPrioridad, 'cocina', true)
    await imprimirPDF(filePathPrioridad)
  }

  if (itemsNormales.length > 0) {
    const filePathNormal = await generarPDFComanda(comanda, itemsNormales, 'cocina', false)
    await imprimirPDF(filePathNormal)
  }

  return itemsPrioridad.length > 0 || itemsNormales.length > 0 ? true : null
}

const imprimirComandaCaja = async (comandaId) => {
  const comanda = await obtenerDatosComanda(comandaId)
  if (!comanda) throw new Error('Comanda no encontrada')

  if (comanda.items.length === 0) return null

  const filePath = await generarPDFComanda(comanda, comanda.items, 'caja')
  await imprimirPDF(filePath)
  return filePath
}


module.exports = {
  imprimirFactura,
  abrirCajaRegistradora,
  imprimirCierre,
  imprimirComandaCocina,
  imprimirComandaCaja,
}