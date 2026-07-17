import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import { Settings } from 'lucide-react'
import { sileo } from 'sileo'
import { getConsultasRapidas } from '../../../services/consultasService'
import { cambiarCierrePassword } from '../../../services/configuracionService'

export default function ModalConfigurarCierre({ show, onHide, seleccionadas, onChange }) {
  const [consultas, setConsultas] = useState([])
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [cambiandoPassword, setCambiandoPassword] = useState(false)

  useEffect(() => {
    if (show) getConsultasRapidas().then(setConsultas)
  }, [show])

  const toggle = (id) => {
    onChange(seleccionadas.includes(id)
      ? seleccionadas.filter(s => s !== id)
      : [...seleccionadas, id])
  }

  const handleCambiarPassword = async () => {
    setCambiandoPassword(true)
    try {
      await cambiarCierrePassword(passwordActual, passwordNueva)
      sileo.success({ title: 'Contraseña actualizada', description: 'La contraseña de cierre fue cambiada' })
      setPasswordActual('')
      setPasswordNueva('')
    } catch (err) {
      sileo.error({ title: 'Error', description: err.response?.data?.msg || 'No se pudo cambiar la contraseña' })
    } finally {
      setCambiandoPassword(false)
    }
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

        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {consultas.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              No hay consultas rápidas guardadas todavía.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {consultas.map(c => {
                const activo = seleccionadas.includes(c.id)
                return (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', borderRadius: 10,
                      border: `1px solid ${activo ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: activo ? 'var(--color-primary)' : 'transparent',
                      cursor: 'pointer',
                      color: activo ? 'var(--color-text-bg)' : 'var(--color-text)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={() => toggle(c.id)}
                    />
                    {c.titulo}
                  </label>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
            <span className="fw-semibold small" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Cambiar contraseña de acceso
            </span>
            <div className="d-flex flex-column gap-2 mt-2">
              <input
                type="password"
                placeholder="Contraseña actual"
                value={passwordActual}
                onChange={e => setPasswordActual(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.85rem' }}
              />
              <input
                type="password"
                placeholder="Contraseña nueva"
                value={passwordNueva}
                onChange={e => setPasswordNueva(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.85rem' }}
              />
              <button
                onClick={handleCambiarPassword}
                disabled={cambiandoPassword || !passwordActual || !passwordNueva}
                style={{ width: '100%', background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '7px', color: 'var(--color-text-bg)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: (cambiandoPassword || !passwordActual || !passwordNueva) ? 0.6 : 1 }}
              >
                {cambiandoPassword ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </div>

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