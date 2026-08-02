import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'

export default function ModalFichaComanda({ show, onHide, onConfirmar }) {
  const [sinFicha, setSinFicha] = useState(false)
  const [numero, setNumero] = useState('')

  useEffect(() => {
    if (show) { setSinFicha(false); setNumero('') }
  }, [show])

  const incompleto = !sinFicha && !numero.trim()

  const handleConfirmar = () => {
    if (incompleto) return
    onConfirmar(sinFicha ? 'Truchas de Cocina' : `Ficha #${numero.trim()}`)
  }

  return (
    <Modal show={show} onHide={onHide} centered animation={false} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
          <span className="fw-bold fs-5" style={{ color: 'var(--color-text-bg)' }}>
            Número de ficha
          </span>
          <div className="opacity-70 small mt-1" style={{ color: 'var(--color-text-bg)' }}>
            Esta comanda todavía no tiene ficha — indicá una para la trucha que estás agregando.
          </div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <input
              type="text"
              inputMode="numeric"
              disabled={sinFicha}
              value={numero}
              onChange={e => setNumero(e.target.value)}
              placeholder="Ej: 12"
              style={{ width: 100, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: sinFicha ? 'var(--color-border)' : 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.95rem', opacity: sinFicha ? 0.5 : 1 }}
            />
            <label className="d-flex align-items-center gap-2" style={{ color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={sinFicha}
                onChange={e => { setSinFicha(e.target.checked); setNumero('') }}
                style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
              />
              Sin ficha (truchas de cocina)
            </label>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button onClick={onHide} style={{ background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: 'var(--color-btn-secondary-text)' }}>
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={incompleto}
              style={{ background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '8px 16px', color: 'var(--color-text-bg)', fontWeight: 600, cursor: 'pointer', opacity: incompleto ? 0.6 : 1 }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}