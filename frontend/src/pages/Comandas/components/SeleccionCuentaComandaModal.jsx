import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { Users, Plus } from 'lucide-react'

export default function SeleccionCuentaComandaModal({ show, onHide, mesa, facturas, onSeleccionar, onCrear, creando }) {
  const [modoNueva, setModoNueva] = useState(false)
  const [nombre, setNombre] = useState('')

  const handleConfirmarNueva = () => {
    if (!nombre.trim()) return
    onCrear(nombre.trim())
  }

  const cerrar = () => {
    setModoNueva(false)
    setNombre('')
    onHide()
  }

  return (
    <Modal show={show} onHide={cerrar} centered animation={false} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center gap-2">
            <Users size={20} color="var(--color-text-bg)" />
            <span className="fw-bold fs-5" style={{ color: 'var(--color-text-bg)' }}>
              Mesa {mesa?.nombre || mesa?.id} — varias cuentas
            </span>
          </div>
          <div className="opacity-70 small mt-1" style={{ color: 'var(--color-text-bg)' }}>
            Elegí a cuál cuenta pertenece esta comanda.
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
          {!modoNueva ? (
            <>
              <div className="d-flex flex-column gap-2 mb-3">
                {facturas.map(f => (
                  <button
                    key={f.id}
                    onClick={() => onSeleccionar(f.id)}
                    style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', cursor: 'pointer' }}
                  >
                    <div style={{ fontWeight: 600 }}>{f.detalle || `Cuenta #${f.id}`}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      ₡{Number(f.total).toLocaleString('es-CR')}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setModoNueva(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, border: '2px dashed var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                <Plus size={16} /> Nueva cuenta
              </button>
            </>
          ) : (
            <>
              <label className="small fw-medium mb-1 d-block" style={{ color: 'var(--color-text)' }}>
                Nombre para esta cuenta
              </label>
              <input
                autoFocus
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleConfirmarNueva() }}
                placeholder="Ej: Familia Rodríguez"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '1rem', marginBottom: 16 }}
              />
              <div className="d-flex justify-content-end gap-2">
                <button onClick={() => setModoNueva(false)} style={{ background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: 'var(--color-btn-secondary-text)' }}>
                  Atrás
                </button>
                <button
                  onClick={handleConfirmarNueva}
                  disabled={!nombre.trim() || creando}
                  style={{ background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '8px 16px', color: 'var(--color-text-bg)', fontWeight: 600, cursor: 'pointer', opacity: (!nombre.trim() || creando) ? 0.6 : 1 }}
                >
                  {creando ? 'Creando...' : 'Crear cuenta'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}