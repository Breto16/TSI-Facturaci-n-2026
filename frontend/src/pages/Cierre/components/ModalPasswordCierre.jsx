import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { Lock } from 'lucide-react'
import { GRADIENTS } from '../../../constants/theme'
import { validarCierrePassword } from '../../../services/configuracionService'

export default function ModalPasswordCierre({ show, onValidado, onCancelar }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [validando, setValidando] = useState(false)

  const handleValidar = async () => {
    setValidando(true)
    setError('')
    try {
      await validarCierrePassword(password)
      onValidado()
    } catch {
      setError('Contraseña incorrecta.')
    } finally {
      setValidando(false)
    }
  }

  return (
    <Modal show={show} centered animation={false} onHide={onCancelar} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ background: GRADIENTS.rojo, padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center gap-2">
            <Lock size={20} color="white" />
            <span className="fw-bold text-white fs-5">Acceso a Cierre</span>
          </div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
          {error && (
            <div className="mb-3 p-2 rounded small" style={{ background: '#fef2f2', color: '#c70009', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}
          <input
            autoFocus
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleValidar() }}
            placeholder="Contraseña"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '1rem', marginBottom: 16 }}
          />
          <div className="d-flex gap-2">
            <button
              onClick={onCancelar}
              style={{ flex: 1, background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '10px', color: 'var(--color-btn-secondary-text)', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleValidar}
              disabled={validando || !password}
              style={{ flex: 1, background: GRADIENTS.rojo, border: 'none', borderRadius: 8, padding: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: (validando || !password) ? 0.6 : 1 }}
            >
              {validando ? 'Verificando...' : 'Entrar'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}