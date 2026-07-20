import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner, Modal } from 'react-bootstrap'
import { ArrowLeft, Plus, Minus, Trash2, Send, CheckCircle2, Circle } from 'lucide-react'
import { sileo } from 'sileo'
import { useAuth } from '../../context/AuthContext'
import SelectorProductosComanda from './components/SelectorProductosComanda'
import ModalDetalleItem from './components/ModalDetalleItem'
import { getComandasPorFactura, crearComanda } from '../../services/comandasService'
import { getFactura, actualizarDetalle } from '../../services/facturasService'
import { formatoTranscurrido, colorTranscurrido } from '../../utils/tiempo'

const ACOMPANAMIENTO_LABEL = {
  yuca: 'Yuca', papa: 'Papa', patacon: 'Patacón', especial: 'Especial', solo: 'Solo(a)',
}

const formatoItem = (item) => {
  let texto = `${item.cantidad}× ${item.descripcion}`
  if (item.variante) texto += ` (${item.variante})`
  if (item.acompanamiento) texto += ` con ${ACOMPANAMIENTO_LABEL[item.acompanamiento] || item.acompanamiento}`
  return texto
}

export default function ComandaMesaPage() {
  const { facturaId } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [factura, setFactura] = useState(null)
  const [nombreCuenta, setNombreCuenta] = useState('')
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [carrito, setCarrito] = useState([])
  const [sinFicha, setSinFicha] = useState(false)
  const [numeroFicha, setNumeroFicha] = useState('')
  const [modalSelector, setModalSelector] = useState(false)
  const [productoActivo, setProductoActivo] = useState(null)
  const [varianteActiva, setVarianteActiva] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [focusTrigger, setFocusTrigger] = useState(0)
  const [ahora, setAhora] = useState(Date.now())
  const [imprimirSalon, setImprimirSalon] = useState(false)

  const cargarTodo = useCallback(async () => {
    setCargando(true)
    try {
      const [f, hist] = await Promise.all([
        getFactura(facturaId),
        getComandasPorFactura(facturaId),
      ])
      setFactura(f)
      setNombreCuenta(f.detalle || '')
      setHistorial(hist)
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudo cargar la cuenta' })
      navigate('/mesas')
    } finally {
      setCargando(false)
    }
  }, [facturaId, navigate])

  useEffect(() => { cargarTodo() }, [cargarTodo])

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Protección contra pérdida accidental de la comanda sin enviar
  useEffect(() => {
    if (carrito.length === 0) return

    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Entrada "centinela" en el historial: si el usuario usa el botón
    // atrás del navegador/dispositivo, primero cae acá y le preguntamos.
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      const salir = window.confirm('Tenés productos sin enviar en esta comanda. ¿Seguro que querés salir? Se van a perder.')
      if (!salir) {
        window.history.pushState(null, '', window.location.href)
      }
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [carrito.length])

  const handleGuardarNombre = async () => {
    if (nombreCuenta === (factura?.detalle || '')) return
    try {
      const f = await actualizarDetalle(facturaId, nombreCuenta)
      setFactura(f)
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo guardar el nombre' })
    }
  }

  const necesitaFicha = carrito.some(i => i.requiereFicha)

  const handleSeleccionarOpcion = (opcion) => {
    setModalSelector(false)
    setProductoActivo(opcion.producto)
    setVarianteActiva(opcion.variante)
  }

  const handleConfirmarItem = (item) => {
    const requiereFicha = !!productoActivo?.requiere_ficha
    setCarrito(prev => [...prev, { ...item, uid: Date.now() + Math.random(), requiereFicha }])
    setProductoActivo(null)
    setVarianteActiva(null)
  }

  const quitarDelCarrito = (uid) => {
    setCarrito(prev => prev.filter(i => i.uid !== uid))
  }

  const cambiarCantidad = (uid, delta) => {
    setCarrito(prev => prev
      .map(item => item.uid === uid ? { ...item, cantidad: item.cantidad + delta } : item)
      .filter(item => item.cantidad > 0)
    )
  }
  const toggleSaleAntes = (uid) => {
    setCarrito(prev => prev.map(item =>
      item.uid === uid ? { ...item, saleAntes: !item.saleAntes } : item
    ))
  }

  const fichaIncompleta = necesitaFicha && !sinFicha && !numeroFicha.trim()

  const handleEnviar = async () => {
    if (carrito.length === 0 || fichaIncompleta || !factura) return
    setEnviando(true)
    try {
      const fichaFinal = necesitaFicha
        ? (sinFicha ? 'Truchas de Cocina' : `Ficha #${numeroFicha.trim()}`)
        : null

      await crearComanda(
        facturaId,
        factura.mesa_id,
        usuario?.saloneroId || null,
        carrito.map(({ uid, requiereFicha, ...item }) => item),
        fichaFinal,
        imprimirSalon
      )
      sileo.success({ title: 'Comanda enviada', description: 'Se envió a cocina/caja correctamente' })
      setCarrito([])
      setSinFicha(false)
      setNumeroFicha('')
      setImprimirSalon(false)
      cargarTodo()
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudo enviar la comanda' })
    } finally {
      setEnviando(false)
    }
  }

  const historialOrdenado = [...historial].sort((a, b) => {
    const aCompleta = a.items.every(i => i.despachado)
    const bCompleta = b.items.every(i => i.despachado)
    if (aCompleta !== bCompleta) return aCompleta ? 1 : -1
    return new Date(a.creado_en) - new Date(b.creado_en)
  })

  if (cargando) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '100%' }}>
        <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (!factura) return null

  const mesaLimpia = (factura.mesa_nombre || factura.mesa_id).toString().replace(/mesa/i, '').trim()

  return (
    <div style={{ height: '100%', padding: '12px 16px' }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button
          onClick={() => {
            if (carrito.length > 0) {
              const salir = window.confirm('Tenés productos sin enviar en esta comanda. ¿Seguro que querés salir? Se van a perder.')
              if (!salir) return
            }
            navigate('/mesas')
          }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={22} />
        </button>
        <h5 className="mb-0 fw-semibold" style={{ color: 'var(--color-text)' }}>
          Mesa {mesaLimpia}
        </h5>
        <input
          type="text"
          value={nombreCuenta}
          onChange={e => setNombreCuenta(e.target.value)}
          onBlur={handleGuardarNombre}
          placeholder="Nombre de la cuenta (opcional)"
          style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.9rem' }}
        />
      </div>

      <div className="row g-3" style={{ height: 'calc(100% - 48px)' }}>

        <div className="col-12 col-lg-7" style={{ height: '100%' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

            <button
              onClick={() => { setFocusTrigger(f => f + 1); setModalSelector(true) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px', borderRadius: 12, border: '2px dashed var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 700 }}
            >
              <Plus size={20} /> Agregar producto
            </button>
            <label className="d-flex align-items-center gap-2" style={{ color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={imprimirSalon}
                onChange={e => setImprimirSalon(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
              />
              Imprimir también ticket en caja
            </label>
            {necesitaFicha && (
              <div style={{ borderRadius: 10, border: '1px solid var(--color-primary)', padding: '12px 14px' }}>
                <label className="small fw-medium mb-2 d-block" style={{ color: 'var(--color-text)' }}>
                  Número de ficha (truchas)
                </label>
                <div className="d-flex align-items-center gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={sinFicha}
                    value={numeroFicha}
                    onChange={e => setNumeroFicha(e.target.value)}
                    placeholder="Ej: 12"
                    style={{ width: 100, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: sinFicha ? 'var(--color-border)' : 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.95rem', opacity: sinFicha ? 0.5 : 1 }}
                  />
                  <label className="d-flex align-items-center gap-2" style={{ color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={sinFicha}
                      onChange={e => { setSinFicha(e.target.checked); setNumeroFicha('') }}
                      style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                    />
                    Sin ficha (truchas de cocina)
                  </label>
                </div>
              </div>
            )}

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', borderRadius: 12, border: '1px solid var(--color-border)', padding: 12 }}>
              {carrito.length === 0 ? (
                <div className="text-center py-4" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Todavía no agregaste productos
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {carrito.map(item => (
                    <div key={item.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 10, border: '1px solid var(--color-border)', padding: '10px 14px', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}>{formatoItem(item)}</div>
                        {item.detalle && (
                          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{item.detalle}</div>
                        )}
                        {item.categoria === 'cocina' && (
                          <label
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              checked={!!item.saleAntes}
                              onChange={() => toggleSaleAntes(item.uid)}
                              style={{ width: 14, height: 14, accentColor: 'var(--color-primary)' }}
                            />
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: item.saleAntes ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                              Sale antes
                            </span>
                          </label>
                        )}
                      </div>

                      <div className="d-flex align-items-center gap-1" style={{ flexShrink: 0 }}>
                        <button
                          onClick={() => cambiarCantidad(item.uid, -1)}
                          title={item.cantidad === 1 ? 'Quitar' : 'Restar uno'}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, color: 'var(--color-text)', fontSize: '0.9rem' }}>
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(item.uid, 1)}
                          title="Sumar uno"
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => quitarDelCarrito(item.uid)}
                        title="Eliminar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', flexShrink: 0 }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleEnviar}
              disabled={carrito.length === 0 || enviando || fichaIncompleta}
              style={{ width: '100%', background: 'var(--color-primary)', border: 'none', borderRadius: 10, padding: '16px', color: 'var(--color-text-bg)', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (carrito.length === 0 || enviando || fichaIncompleta) ? 0.6 : 1 }}
            >
              <Send size={18} />
              {enviando ? 'Enviando...' : `Enviar comanda${carrito.length > 0 ? ` (${carrito.length})` : ''}`}
            </button>
          </div>
        </div>

        <div className="col-12 col-lg-5" style={{ height: '100%' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <span className="fw-semibold small mb-2" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Comandas de esta cuenta
            </span>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {historialOrdenado.length === 0 ? (
                <div className="text-center py-3" style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  Sin comandas todavía
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {historialOrdenado.map(c => {
                    const completa = c.items.every(i => i.despachado)
                    const transcurrido = ahora - new Date(c.creado_en).getTime()
                    return (
                      <div key={c.id} style={{ borderRadius: 12, border: '1px solid var(--color-border)', padding: '10px 14px', background: 'var(--color-surface)', opacity: completa ? 0.6 : 1 }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {new Date(c.creado_en).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!completa && (
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: colorTranscurrido(transcurrido) }}>
                              {formatoTranscurrido(transcurrido)}
                            </span>
                          )}
                        </div>
                        {c.ficha && (
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
                            {c.ficha}
                          </div>
                        )}
                        <div className="d-flex flex-column gap-1">
                          {c.items.map(item => (
                            <div key={item.id} className="d-flex align-items-center gap-2">
                              {item.despachado
                                ? <CheckCircle2 size={15} color="var(--color-success)" />
                                : <Circle size={15} color="var(--color-text-secondary)" />}
                              <span style={{ fontSize: '0.85rem', color: item.despachado ? 'var(--color-text-secondary)' : 'var(--color-text)' }}>
                                {formatoItem(item)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal show={modalSelector} onHide={() => setModalSelector(false)} centered size="lg" animation={false} contentClassName="border-0 bg-transparent">
        <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--color-surface)', padding: '1.5rem', height: '75vh' }}>
          <SelectorProductosComanda onSeleccionar={handleSeleccionarOpcion} focusTrigger={focusTrigger} />
        </div>
      </Modal>

      <ModalDetalleItem
        show={!!productoActivo}
        producto={productoActivo}
        varianteInicial={varianteActiva}
        onHide={() => { setProductoActivo(null); setVarianteActiva(null) }}
        onConfirmar={handleConfirmarItem}
      />
    </div>
  )
}