import { Modal } from 'react-bootstrap'
import { PlusCircle } from 'lucide-react'
import { GRADIENTS } from '../../../constants/theme'

export default function ConfirmacionModal({ show, onHide, onConfirmar, mesa, creando }) {
  return (
    <Modal show={show} onHide={onHide} centered animation={false} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>

        <div style={{ background: GRADIENTS.forest, padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <PlusCircle size={20} color="white" />
              <span className="fw-bold text-white fs-5">Nueva cuenta</span>
            </div>
            <button
              onClick={onHide}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              ✕
            </button>
          </div>
          <div className="text-white opacity-70 small mt-1">
            {mesa?.nombre || `Mesa ${mesa?.id}`}
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
          <p style={{ color: 'var(--color-text)', marginBottom: '1.5rem' }}>
            ¿Querés crear una cuenta adicional en esta mesa?
          </p>

          <div className="d-flex justify-content-end gap-2">
            <button
              onClick={onHide}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-btn-secondary-border)',
                borderRadius: 8,
                padding: '7px 16px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                color: 'var(--color-btn-secondary-text)',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={creando}
              style={{
                background: GRADIENTS.forest,
                border: 'none',
                borderRadius: 8,
                padding: '7px 16px',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: creando ? 0.7 : 1,
              }}
            >
              {creando ? 'Creando...' : 'Sí, crear cuenta'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}