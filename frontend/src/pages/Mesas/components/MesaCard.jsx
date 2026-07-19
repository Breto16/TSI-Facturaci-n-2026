import { useState, useRef, useCallback, useEffect } from 'react'

const ESTADO_COLOR = {
  disponible: 'var(--color-success)',
  ocupada:    'var(--color-danger)',
  porPagar:   'var(--color-warning)',
  dividida:   'var(--color-info)',
}

const LONG_PRESS_MS = 800
const UMBRAL_MOVIMIENTO = 10 // px — más que esto se considera scroll, no tap

export default function MesaCard({ mesa, numero, onClick, onLongPress, size = 72, mobile = false }) {
  const [hover, setHover] = useState(false)
  const [progreso, setProgreso] = useState(false)
  const timerRef = useRef(null)
  const longPressDisparado = useRef(false)
  const presionandoRef = useRef(false)
  const movimientoExcedido = useRef(false)
  const touchStartPos = useRef({ x: 0, y: 0 })

  const esAccesoRapido = numero === 0
  const estado = mesa?.estado || 'disponible'
  const color = ESTADO_COLOR[estado] || ESTADO_COLOR.disponible

  const limpiar = useCallback(() => {
    clearTimeout(timerRef.current)
    setProgreso(false)
    presionandoRef.current = false
  }, [])

  const iniciarPress = useCallback((e) => {
    // Solo bloqueamos el comportamiento default en mouse (selección de texto,
    // imagen fantasma al arrastrar). En touch NO lo hacemos: interferir ahí
    // es justo lo que causaba que un scroll real se confundiera con un tap.
    if (e.type === 'mousedown') e.preventDefault()

    longPressDisparado.current = false
    movimientoExcedido.current = false
    presionandoRef.current = true
    setProgreso(true)

    if (e.touches && e.touches[0]) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    timerRef.current = setTimeout(() => {
      if (!presionandoRef.current || movimientoExcedido.current) return
      longPressDisparado.current = true
      setProgreso(false)
      onLongPress?.()
    }, LONG_PRESS_MS)
  }, [onLongPress])

  const handleTouchMove = useCallback((e) => {
    if (!presionandoRef.current || !e.touches?.[0]) return
    const dx = e.touches[0].clientX - touchStartPos.current.x
    const dy = e.touches[0].clientY - touchStartPos.current.y
    if (Math.sqrt(dx * dx + dy * dy) > UMBRAL_MOVIMIENTO) {
      movimientoExcedido.current = true
      limpiar()
    }
  }, [limpiar])

  const handleRelease = useCallback(() => {
    if (movimientoExcedido.current) {
      limpiar()
      return
    }
    if (!longPressDisparado.current && presionandoRef.current) {
      limpiar()
      onClick?.()
    } else {
      limpiar()
    }
  }, [onClick, limpiar])

  const handleCancel = useCallback(() => {
    limpiar()
    longPressDisparado.current = false
    movimientoExcedido.current = false
  }, [limpiar])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const estiloContenedor = mobile
    ? { width: '100%', height: '100%', aspectRatio: '1' }
    : { width: size, height: size }

  return (
    <div
      onMouseDown={iniciarPress}
      onMouseUp={handleRelease}
      onMouseLeave={handleCancel}
      onMouseEnter={() => setHover(true)}
      onTouchStart={iniciarPress}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleRelease}
      onTouchCancel={handleCancel}
      onContextMenu={(e) => e.preventDefault()}
      title={esAccesoRapido ? 'Caja rápida' : `Mesa ${numero}`}
      style={{
        ...estiloContenedor,
        borderRadius: 12,
        border: `2px solid ${color}`,
        backgroundColor: progreso
          ? `${color}33`
          : hover
            ? `${color}18`
            : 'var(--color-surface)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: progreso
          ? `background-color ${LONG_PRESS_MS}ms linear`
          : 'background-color 0.15s ease',
        gap: 2,
        boxShadow: hover || progreso ? `0 4px 12px ${color}44` : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <span style={{
        fontSize: mobile ? '4vw' : `${Math.round(size * 0.22)}px`,
        fontWeight: 700,
        color: color,
        lineHeight: 1,
        pointerEvents: 'none',
      }}>
        {esAccesoRapido ? 'CAJA' : numero}
      </span>
      {mesa?.facturas_activas > 0 && (
        <span style={{
          fontSize: mobile ? '2.5vw' : `${Math.round(size * 0.13)}px`,
          color: color,
          fontWeight: 600,
          lineHeight: 1,
          pointerEvents: 'none',
        }}>
          {mesa.facturas_activas} fact.
        </span>
      )}
    </div>
  )
}