import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import { Settings } from 'lucide-react'
import { GRADIENTS } from '../../../constants/theme'
import { getConsultasRapidas } from '../../../services/consultasService'

export default function ModalConfigurarCierre({ show, onHide, seleccionadas, onChange }) {
  const [consultas, setConsultas] = useState([])

  useEffect(() => {
    if (show) getConsultasRapidas().then(setConsultas)
  }, [show])

  const toggle = (id) => {
    onChange(seleccionadas.includes(id)
      ? seleccionadas.filter(s => s !== id)
      : [...seleccionadas, id])
  }

  return (
    <Modal show={show} onHide={onHide} centered animation={false} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Settings size={20} color="var(--color-text-bg)" />
              <span className="fw-bold fs-5" style={{ color: 'var(--color-text-bg)' }}>Configurar cierre</span>
            </div>
            <button onClick={onHide} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--color-text-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div className="opacity-70 small mt-1" style={{ color: 'var(--color-text-bg)' }}>
            Elige qué consultas rápidas incluir en el ticket de cierre.
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
          {consultas.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              No hay consultas rápidas guardadas todavía.
            </p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {consultas.map(c => (
                <label
                  key={c.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer', color: 'var(--color-text)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={seleccionadas.includes(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                  {c.titulo}
                </label>
              ))}
            </div>
          )}

          <div className="d-flex justify-content-end mt-4">
            <button
              onClick={onHide}
              style={{ background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '7px 16px', color: 'var(--color-text-bg)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}