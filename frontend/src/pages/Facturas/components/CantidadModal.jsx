import { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { GRADIENTS } from '../../../constants/theme'

export default function CantidadModal({ show, onHide, producto, onConfirmar }) {
  const [cantidad, setCantidad] = useState('1')
  const inputRef = useRef(null)

  useEffect(() => {
    if (show) {
      setCantidad('1')
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [show])

  const handleConfirmar = () => {
    const n = parseInt(cantidad)
    if (!n || n <= 0) return
    onConfirmar(n)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirmar()
    if (e.key === 'Escape') onHide()
  }

  return (
    <Modal show={show} onHide={onHide} centered animation={false} size="sm" contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ background: GRADIENTS.forest, padding: '1rem 1.25rem' }}>
          <div className="d-flex align-items-center justify-content-between">
            <span className="fw-bold text-white">{producto?.descripcion}</span>
            <button onClick={onHide} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div className="text-white opacity-70 small mt-1">
            ₡{Number(producto?.precio).toLocaleString('es-CR')} por unidad
          </div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.25rem' }}>
          <label className="small fw-medium mb-1" style={{ color: 'var(--color-text)' }}>Cantidad</label>
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-background)',
              color: 'var(--color-text)',
              fontSize: '1.1rem',
              textAlign: 'center',
              outline: 'none',
            }}
          />
          <div className="d-flex gap-2 mt-3">
            <button onClick={onHide} style={{ flex: 1, background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '7px', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-btn-secondary-text)' }}>
              Cancelar
            </button>
            <button onClick={handleConfirmar} style={{ flex: 1, background: GRADIENTS.forest, border: 'none', borderRadius: 8, padding: '7px', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              Agregar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}