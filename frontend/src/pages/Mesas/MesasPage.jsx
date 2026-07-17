import { useState, useEffect, useCallback } from 'react'
import { Spinner } from 'react-bootstrap'
import { sileo } from 'sileo'
import MesaCard from './components/MesaCard'
import { getMesasConEstado } from '../../services/mesasService'
import { socket } from '../../services/socket'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import SeleccionFacturaModal from './components/SeleccionFacturaModal'
import ConfirmacionModal from './components/ConfirmacionModal'
import SeleccionCuentaComandaModal from '../Comandas/components/SeleccionCuentaComandaModal'
import ModalNuevaCuenta from '../Comandas/components/ModalNuevaCuenta'
import { getFacturasPorMesa, crearFactura, actualizarDetalle } from '../../services/facturasService'


const BLOQUE_A = {
  label: 'Salón 20',
  filas: 2,
  columnas: 4,
  celdas: [
    24, 23, 22, 21,
    25, 26, 27, 28,
  ],
}

const BLOQUE_D = {
  label: 'Salón 30',
  filas: 2,
  columnas: 4,
  celdas: [
    31, 32, 33, null,
    34, 35, null, 0,
  ],
}

const BLOQUE_B = {
  label: 'Salón B',
  filas: 4,
  columnas: 2,
  celdas: [
    9, 10,
    null, null,
    null, 11,
    null, 12,
  ],
}

const BLOQUE_C = {
  label: 'Salón C',
  filas: 4,
  columnas: 2,
  celdas: [
    8, 1,
    7, 2,
    6, 3,
    5, 4,
  ],
}

const BloqueGrid = ({ bloque, getMesa, onClickMesa, onLongPressMesa, celdaSize, gap }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${bloque.columnas}, ${celdaSize}px)`,
      gridTemplateRows: `repeat(${bloque.filas}, ${celdaSize}px)`,
      gap,
      padding: 12,
      borderRadius: 16,
      border: '2px solid var(--color-border)',
      backgroundColor: 'var(--color-surface)',
    }}
  >
    {bloque.celdas.map((num, i) =>
      num !== null ? (
        <MesaCard
          key={i}
          mesa={getMesa(num)}
          numero={num}
          onClick={() => onClickMesa(num)}
          onLongPress={() => onLongPressMesa(num)}
          size={celdaSize}
        />
      ) : (
        <div key={i} style={{ width: celdaSize, height: celdaSize }} />
      )
    )}
  </div>
)

const LEYENDA = [
  { color: 'var(--color-success)', label: 'Disponible' },
  { color: 'var(--color-danger)', label: 'Ocupada' },
  { color: 'var(--color-warning)', label: 'Por pagar' },
  { color: 'var(--color-info)', label: 'Dividida' },
]

export default function MesasPage() {
  const { usuario } = useAuth()
  const esSalonero = usuario?.rol === 'salonero'

  const [mesas, setMesas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalSeleccion, setModalSeleccion] = useState({ show: false, mesa: null, facturas: [] })
  const [modalConfirmacion, setModalConfirmacion] = useState({ show: false, mesa: null })
  const [modalCuentas, setModalCuentas] = useState({ show: false, mesa: null, facturas: [] })
  const [modalNuevaCuenta, setModalNuevaCuenta] = useState({ show: false, mesa: null })
  const [creando, setCreando] = useState(false)

  const navigate = useNavigate()

  const cargarMesas = useCallback(async () => {
    setCargando(true)
    try {
      const data = await getMesasConEstado()
      setMesas(data)
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudieron cargar las mesas' })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarMesas() }, [cargarMesas])
  useEffect(() => {
    socket.connect()
    const handler = () => cargarMesas()
    socket.on('mesas:actualizar', handler)
    return () => {
      socket.off('mesas:actualizar', handler)
      socket.disconnect()
    }
  }, [cargarMesas])

  const calcularCeldaSize = useCallback(() => {
    const PADDING = 32
    const GAP_BLOQUES = 24
    const PADDING_INTERNO = 24
    const LEYENDA_H = 48
    const navbarH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')
    ) || 60

    const anchoDisponible = window.innerWidth - PADDING
    const altoDisponible = window.innerHeight - navbarH - LEYENDA_H - PADDING

    const colsTotales = 8
    const gapsInternosEstimados = colsTotales - 1
    const espacioFijoAncho = GAP_BLOQUES * 2 + PADDING_INTERNO * 3
    const filasTotales = 4
    const espacioFijoAlto = PADDING_INTERNO * 2 + GAP_BLOQUES

    const porAncho = Math.floor(
      (anchoDisponible - espacioFijoAncho) / (colsTotales + gapsInternosEstimados * 0.12)
    )
    const porAlto = Math.floor(
      (altoDisponible - espacioFijoAlto) / (filasTotales + (filasTotales - 1) * 0.12)
    )

    return Math.max(48, Math.min(porAncho, porAlto))
  }, [])

  const [celdaSize, setCeldaSize] = useState(calcularCeldaSize)

  useEffect(() => {
    const handleResize = () => setCeldaSize(calcularCeldaSize())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [calcularCeldaSize])

  const getMesa = (numero) => mesas.find(m => m.id === numero)

  const crearYNavegar = async (mesaId) => {
    setCreando(true)
    try {
      const factura = await crearFactura(mesaId)
      navigate(`/facturas/${factura.id}`)
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudo crear la factura' })
    } finally {
      setCreando(false)
    }
  }

  const handleClickMesa = async (numero) => {
    const mesa = getMesa(numero) || { id: numero, nombre: `Mesa ${numero}` }

    if (esSalonero) {
      try {
        const facturas = await getFacturasPorMesa(numero)
        if (facturas.length === 0) {
          setCreando(true)
          const factura = await crearFactura(numero)
          setCreando(false)
          navigate(`/comandas/factura/${factura.id}`)
        } else if (facturas.length === 1) {
          navigate(`/comandas/factura/${facturas[0].id}`)
        } else {
          setModalCuentas({ show: true, mesa, facturas })
        }
      } catch (err) {
        console.error(err)
        setCreando(false)
        sileo.error({ title: 'Error', description: 'No se pudo acceder a la mesa' })
      }
      return
    }

    try {
      const facturas = await getFacturasPorMesa(numero)
      if (facturas.length === 0) {
        await crearYNavegar(numero)
      } else if (facturas.length === 1) {
        navigate(`/facturas/${facturas[0].id}`)
      } else {
        setModalSeleccion({ show: true, mesa, facturas })
      }
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudo acceder a la mesa' })
    }
  }

  const handleLongPress = (numero) => {
    const mesa = getMesa(numero) || { id: numero, nombre: `Mesa ${numero}` }

    if (esSalonero) {
      setModalNuevaCuenta({ show: true, mesa })
      return
    }

    setModalConfirmacion({ show: true, mesa })
  }

  const handleCrearCuentaDesdeSeleccion = async (nombre) => {
    setCreando(true)
    try {
      const factura = await crearFactura(modalCuentas.mesa.id)
      await actualizarDetalle(factura.id, nombre)
      setModalCuentas({ show: false, mesa: null, facturas: [] })
      navigate(`/comandas/factura/${factura.id}`)
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudo crear la cuenta' })
    } finally {
      setCreando(false)
    }
  }

  const handleCrearCuentaDesdeLongPress = async (nombre) => {
    setCreando(true)
    try {
      const factura = await crearFactura(modalNuevaCuenta.mesa.id)
      await actualizarDetalle(factura.id, nombre)
      setModalNuevaCuenta({ show: false, mesa: null })
      navigate(`/comandas/factura/${factura.id}`)
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudo crear la cuenta' })
    } finally {
      setCreando(false)
    }
  }

  const gap = Math.max(6, Math.round(celdaSize * 0.11))

  const gridProps = {
    getMesa,
    onClickMesa: handleClickMesa,
    onLongPressMesa: handleLongPress,
    celdaSize,
    gap,
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 0',
    }}>
      {cargando ? (
        <div className="d-flex align-items-center justify-content-center" style={{ flex: 1 }}>
          <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
        </div>
      ) : (
        <>
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <div className="d-none d-md-flex align-items-center gap-3">
              <div className="d-flex flex-column gap-2">
                <BloqueGrid bloque={BLOQUE_A} {...gridProps} />
                <BloqueGrid bloque={BLOQUE_D} {...gridProps} />
              </div>
              <BloqueGrid bloque={BLOQUE_B} {...gridProps} />
              <BloqueGrid bloque={BLOQUE_C} {...gridProps} />
            </div>

            <div
              className="d-md-none"
              style={{ overflowY: 'auto', width: '100%', padding: '8px' }}
            >
              {[BLOQUE_A, BLOQUE_D, BLOQUE_B, BLOQUE_C].map((bloque, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    padding: 12,
                    borderRadius: 16,
                    border: '2px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}>
                    {bloque.celdas.filter(num => num !== null).map((num, ci) => (
                      <div key={ci} style={{ width: 'calc(25% - 6px)' }}>
                        <MesaCard
                          key={ci}
                          mesa={getMesa(num)}
                          numero={num}
                          onClick={() => handleClickMesa(num)}
                          onLongPress={() => handleLongPress(num)}
                          size={null}
                          mobile
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 4px 0',
            borderTop: '1px solid var(--color-border)',
            marginTop: 8,
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div className="d-flex flex-wrap gap-3">
              {LEYENDA.map(item => (
                <div key={item.label} className="d-flex align-items-center gap-2">
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: item.color,
                  }} />
                  <span style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-text-secondary)',
                  }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={cargarMesas}
              disabled={cargando}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-btn-secondary-border)',
                borderRadius: 8,
                padding: '5px 14px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                color: 'var(--color-btn-secondary-text)',
              }}
            >
              Actualizar
            </button>
          </div>
        </>
      )}

      {!esSalonero && (
        <>
          <SeleccionFacturaModal
            show={modalSeleccion.show}
            onHide={() => setModalSeleccion({ show: false, mesa: null, facturas: [] })}
            mesa={modalSeleccion.mesa}
            facturas={modalSeleccion.facturas}
            onSeleccionar={(id) => {
              setModalSeleccion({ show: false, mesa: null, facturas: [] })
              navigate(`/facturas/${id}`)
            }}
            onNueva={() => crearYNavegar(modalSeleccion.mesa?.id)}
            creando={creando}
          />

          <ConfirmacionModal
            show={modalConfirmacion.show}
            onHide={() => setModalConfirmacion({ show: false, mesa: null })}
            mesa={modalConfirmacion.mesa}
            onConfirmar={() => {
              setModalConfirmacion({ show: false, mesa: null })
              crearYNavegar(modalConfirmacion.mesa?.id)
            }}
            creando={creando}
          />
        </>
      )}

      {esSalonero && (
        <>
          <SeleccionCuentaComandaModal
            show={modalCuentas.show}
            onHide={() => setModalCuentas({ show: false, mesa: null, facturas: [] })}
            mesa={modalCuentas.mesa}
            facturas={modalCuentas.facturas}
            onSeleccionar={(facturaId) => {
              setModalCuentas({ show: false, mesa: null, facturas: [] })
              navigate(`/comandas/factura/${facturaId}`)
            }}
            onCrear={handleCrearCuentaDesdeSeleccion}
            creando={creando}
          />

          <ModalNuevaCuenta
            show={modalNuevaCuenta.show}
            mesa={modalNuevaCuenta.mesa}
            onHide={() => setModalNuevaCuenta({ show: false, mesa: null })}
            onCrear={handleCrearCuentaDesdeLongPress}
            creando={creando}
          />
        </>
      )}
    </div>
  )
}