import { ChevronsRight, ChevronRight, ArrowRight, ChevronsLeft, ChevronLeft, ArrowLeft } from 'lucide-react'

const BTN = {
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  width: 36,
  height: 36,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-secondary)',
  transition: 'border-color 0.15s, color 0.15s',
}

export default function BotonesMover({ onMover, deshabilitado }) {
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
      width: '10%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '0 4px',
    }}>
      {/* Mover de padre a hija */}
      {btn('todo_derecha', <ChevronsRight size={16} />, 'Mover todo a hija')}
      {btn('fila_derecha', <ChevronRight size={16} />, 'Mover fila a hija')}
      {btn('uno_derecha', <ArrowRight size={16} />, 'Mover 1 a hija')}

      <div style={{ width: 1, height: 16, backgroundColor: 'var(--color-border)' }} />

      {/* Mover de hija a padre */}
      {btn('uno_izquierda', <ArrowLeft size={16} />, 'Regresar 1 a padre')}
      {btn('fila_izquierda', <ChevronLeft size={16} />, 'Regresar fila a padre')}
      {btn('todo_izquierda', <ChevronsLeft size={16} />, 'Regresar todo a padre')}
    </div>
  )
}