import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import { UserPlus } from 'lucide-react'

export default function ModalNuevaCuenta({ show, mesa, onHide, onCrear, creando }) {
  const [nombre, setNombre] = useState('')

  useEffect(() => { if (show) setNombre('') }, [show])

  const handleConfirmar = () => {
    if (!nombre.trim()) return
    onCrear(nombre.trim())
  }

  return (
    <Modal show={show} onHide={onHide} centered animation={false} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center gap-2">
            <UserPlus size={20} color="var(--color-text-bg)" />
            <span className="fw-bold fs-5" style={{ color: 'var(--color-text-bg)' }}>
              Nueva cuenta — Mesa {mesa?.nombre || mesa?.id}
            </span>
          </div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
          <label className="small fw-medium mb-1 d-block" style={{ color: 'var(--color-text)' }}>
            Nombre para esta cuenta
          </label>
          <input
            autoFocus
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirmar() }}
            placeholder="Ej: Familia Rodríguez"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '1rem', marginBottom: 16 }}
          />
          <div className="d-flex justify-content-end gap-2">
            <button onClick={onHide} style={{ background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: 'var(--color-btn-secondary-text)' }}>
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!nombre.trim() || creando}
              style={{ background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '8px 16px', color: 'var(--color-text-bg)', fontWeight: 600, cursor: 'pointer', opacity: (!nombre.trim() || creando) ? 0.6 : 1 }}
            >
              {creando ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}