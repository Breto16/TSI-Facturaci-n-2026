import { useState, useEffect, useCallback, useRef } from 'react'
import { Spinner } from 'react-bootstrap'
import { sileo } from 'sileo'
import { socket } from '../../services/socket'
import { getComandasActivas, marcarItemDespachado, marcarTodoTipoDespachado } from '../../services/comandasService'
import { formatoTranscurrido, colorTranscurrido } from '../../utils/tiempo'

const ACOMPANAMIENTO_LABEL = {
  yuca: 'Yuca', papa: 'Papa', patacon: 'Patacón', especial: 'Especial', solo: 'Solo(a)',
}

const GRACIA_MS = 5000

const formatoItem = (item) => {
  let texto = `${item.cantidad}× ${item.descripcion}`
  if (item.variante) texto += ` (${item.variante})`
  if (item.acompanamiento) texto += ` c/${ACOMPANAMIENTO_LABEL[item.acompanamiento] || item.acompanamiento}`
  return texto
}

const audioNotificacion = new Audio('/sounds/notificacion.wav')

const reproducirBeep = () => {
  audioNotificacion.currentTime = 0
  audioNotificacion.play().catch(err => {
    console.log('No se pudo reproducir el sonido:', err)
  })
}

export default function ValidacionPage() {
  const [comandas, setComandas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ahora, setAhora] = useState(Date.now())
  const completadoRef = useRef({})

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await getComandasActivas()
      setComandas(data)
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudieron cargar las comandas' })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    socket.connect()

    const handleComandaNueva = (comanda) => {
      setComandas(prev => [...prev, comanda])
      if (comanda.items?.some(i => i.categoria === 'cocina')) {
        reproducirBeep()
      }
    }

    const handleItemActualizado = (item) => {
      setComandas(prev => prev.map(c => c.id !== item.comanda_id ? c : {
        ...c,
        items: c.items.map(i => i.id === item.id ? item : i),
      }))
    }

    const handleItemEliminado = ({ itemId }) => {
      setComandas(prev => prev.map(c => ({
        ...c,
        items: c.items.filter(i => i.id !== Number(itemId)),
      })))
    }

    const handleComandaVaciada = ({ comandaId }) => {
      setComandas(prev => prev.map(c =>
        c.id === Number(comandaId) ? { ...c, items: [] } : c
      ))
    }

    socket.on('comanda-item:eliminado', handleItemEliminado)
    socket.on('comanda:vaciada', handleComandaVaciada)

    socket.on('comanda:nueva', handleComandaNueva)
    socket.on('comanda-item:actualizado', handleItemActualizado)

    return () => {
      socket.off('comanda:nueva', handleComandaNueva)
      socket.off('comanda-item:actualizado', handleItemActualizado)
      socket.off('comanda-item:eliminado', handleItemEliminado)
      socket.off('comanda:vaciada', handleComandaVaciada)
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    setComandas(prev => prev.filter(comanda => {
      const seccionVigente = (categoria) => {
        const items = comanda.items.filter(i => i.categoria === categoria)
        if (items.length === 0) return false
        const key = `${comanda.id}:${categoria}`
        const completo = items.every(i => i.despachado)
        if (!completo) return true
        const completadoEn = completadoRef.current[key]
        if (!completadoEn) return true
        return (ahora - completadoEn) < GRACIA_MS
      }
      return seccionVigente('cocina') || seccionVigente('salon')
    }))
  }, [ahora])

  const toggleItem = async (item) => {
    try {
      await marcarItemDespachado(item.id, !item.despachado)
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudo actualizar el item' })
    }
  }

  const marcarTodo = async (comandaId, categoria) => {
    try {
      await marcarTodoTipoDespachado(comandaId, categoria)
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudo actualizar la comanda' })
    }
  }

  const comandasOrdenadas = [...comandas].sort(
    (a, b) => new Date(a.creado_en) - new Date(b.creado_en)
  )

  const renderSeccion = (titulo, categoria) => {
    const tarjetas = comandasOrdenadas
      .map(comanda => {
        const items = comanda.items.filter(i => i.categoria === categoria)
        if (items.length === 0) return null

        const key = `${comanda.id}:${categoria}`
        const completo = items.every(i => i.despachado)

        if (completo) {
          if (!completadoRef.current[key]) completadoRef.current[key] = ahora
        } else if (completadoRef.current[key]) {
          delete completadoRef.current[key]
        }

        const completadoEn = completadoRef.current[key]
        if (completadoEn && (ahora - completadoEn) >= GRACIA_MS) return null

        const transcurrido = ahora - new Date(comanda.creado_en).getTime()
        const progresoGracia = completadoEn
          ? Math.max(0, 100 - ((ahora - completadoEn) / GRACIA_MS) * 100)
          : null

        const mesaLimpia = (comanda.mesa_nombre || comanda.mesa_id).toString().replace(/mesa/i, '').trim()

        return (
          <div
            key={key}
            style={{
              flex: '0 0 280px',
              width: 280,
              borderRadius: 14,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              padding: '14px',
              position: 'relative',
              overflow: 'hidden',
              opacity: completo ? 0.7 : 1,
            }}
          >
            {progresoGracia !== null && (
              <div style={{
                position: 'absolute', top: 0, left: 0, height: 3,
                width: `${progresoGracia}%`,
                background: 'var(--color-success)',
                transition: 'width 1s linear',
              }} />
            )}

            <div className="d-flex justify-content-between align-items-start mb-1">
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-text)', lineHeight: 1.1 }}>
                  Mesa {mesaLimpia}
                </div>
                {comanda.salonero_nombre && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {comanda.salonero_nombre}
                  </div>
                )}
                {comanda.factura_detalle && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {comanda.factura_detalle}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {new Date(comanda.creado_en).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: colorTranscurrido(transcurrido) }}>
                  {formatoTranscurrido(transcurrido)}
                </div>
              </div>
            </div>

            {comanda.ficha && (
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>
                {comanda.ficha}
              </div>
            )}

            <div className="d-flex flex-column gap-1 my-2">
              {items.map(item => (
                <label
                  key={item.id}
                  onClick={() => toggleItem(item)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 2,
                    padding: '6px 10px', borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: item.despachado ? 'var(--color-background)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <input type="checkbox" checked={item.despachado} readOnly style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
                    <span style={{
                      fontSize: '0.88rem',
                      color: item.despachado ? 'var(--color-text-secondary)' : 'var(--color-text)',
                      textDecoration: item.despachado ? 'line-through' : 'none',
                    }}>
                      {formatoItem(item)}
                    </span>
                  </div>
                  {item.detalle && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 24, fontStyle: 'italic' }}>
                      {item.detalle}
                    </span>
                  )}
                </label>
              ))}
            </div>

            {!completo && (
              <button
                onClick={() => marcarTodo(comanda.id, categoria)}
                style={{
                  width: '100%', background: 'var(--color-primary)', border: 'none', borderRadius: 8,
                  padding: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-bg)', cursor: 'pointer',
                }}
              >
                Marcar todo
              </button>
            )}
          </div>
        )
      })
      .filter(Boolean)

    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="fw-semibold small" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
          {titulo}
        </span>
        <div className="d-flex flex-wrap gap-3 mt-2">
          {tarjetas.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', padding: '12px 0' }}>
              Sin pendientes
            </div>
          ) : tarjetas}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
      {cargando ? (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
        </div>
      ) : (
        <div className="d-flex flex-column flex-lg-row gap-4">
          {renderSeccion('Cocina', 'cocina')}
          {renderSeccion('Salón', 'salon')}
        </div>
      )}
    </div>
  )
}