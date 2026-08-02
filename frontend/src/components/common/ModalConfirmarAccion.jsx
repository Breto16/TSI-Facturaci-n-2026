import { Modal } from 'react-bootstrap'

export default function ModalConfirmarAccion({ show, onHide, onConfirmar, titulo, mensaje, textoConfirmar = 'Confirmar', colorAccion = 'var(--color-danger)' }) {
  return (
    <Modal show={show} onHide={onHide} centered animation={false} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ background: colorAccion, padding: '1.25rem 1.5rem' }}>
          <span className="fw-bold fs-5" style={{ color: 'white' }}>{titulo}</span>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
          <p style={{ color: 'var(--color-text)', marginBottom: 20 }}>{mensaje}</p>
          <div className="d-flex justify-content-end gap-2">
            <button onClick={onHide} style={{ background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: 'var(--color-btn-secondary-text)' }}>
              Cancelar
            </button>
            <button onClick={onConfirmar} style={{ background: colorAccion, border: 'none', borderRadius: 8, padding: '8px 16px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
              {textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}