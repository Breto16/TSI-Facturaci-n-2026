import { useState, useEffect } from 'react'
import { ChevronsRight, ChevronRight, ArrowRight, ChevronsLeft, ChevronLeft, ArrowLeft } from 'lucide-react'

export default function BotonesMover({ onMover }) {
  const [btnSize, setBtnSize] = useState(() =>
    Math.max(36, Math.min(56, window.innerWidth * 0.026))
  )

  useEffect(() => {
    const calcular = () => {
      setBtnSize(Math.max(36, Math.min(56, window.innerWidth * 0.026)))
    }
    window.addEventListener('resize', calcular)
    return () => window.removeEventListener('resize', calcular)
  }, [])

  const iconSize = Math.round(btnSize * 0.44)

  const BTN = {
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    width: btnSize,
    height: btnSize,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-secondary)',
    transition: 'border-color 0.15s, color 0.15s',
    flexShrink: 0,
  }

  const btn = (tipo, icono, titulo) => (
    <button
      title={titulo}
      onClick={() => onMover(tipo)}
      style={BTN}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--color-primary)'
        e.currentTarget.style.color = 'var(--color-primary)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.color = 'var(--color-text-secondary)'
      }}
    >
      {icono}
    </button>
  )

  return (
    <div style={{
      flexShrink: 0,
      width: 'fit-content',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Math.round(btnSize * 0.2),
      padding: '0 12px'
    }}>
      {btn('todo_derecha', <ChevronsRight size={iconSize} />, 'Mover todo a hija')}
      {btn('fila_derecha', <ArrowRight size={iconSize} />, 'Mover fila a hija')}
      {btn('uno_derecha', <ChevronRight size={iconSize} />, 'Mover 1 a hija')}

      <div style={{ width: Math.round(btnSize * 0.6), height: 1, backgroundColor: 'var(--color-border)' }} />

      {btn('uno_izquierda', <ChevronLeft size={iconSize} />, 'Regresar 1 a padre')}
      {btn('fila_izquierda', <ArrowLeft size={iconSize} />, 'Regresar fila a padre')}
      {btn('todo_izquierda', <ChevronsLeft size={iconSize} />, 'Regresar todo a padre')}
    </div>
  )
}