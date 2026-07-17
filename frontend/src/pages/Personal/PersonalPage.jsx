import { useState, useEffect, useCallback } from 'react'
import { Modal, Form } from 'react-bootstrap'
import { Users, Plus, RefreshCw, UserCheck, UserX, KeyRound } from 'lucide-react'
import { sileo } from 'sileo'
import { getSaloneros, crearSalonero, toggleSalonero } from '../../services/salonerosService'
import { getPinSalonero, cambiarPinSalonero } from '../../services/configuracionService'
import PageWrapper from '../../components/layout/PageWrapper'

export default function PersonalPage() {
  const [saloneros, setSaloneros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [pinActual, setPinActual] = useState('')
  const [pinNuevo, setPinNuevo] = useState('')
  const [cambiandoPin, setCambiandoPin] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await getSaloneros()
      setSaloneros(data)
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo cargar el personal' })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    getPinSalonero().then(({ pin }) => setPinActual(pin || ''))
  }, [])

  const handleCrear = async () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setGuardando(true)
    try {
      const resultado = await crearSalonero(nombre.trim())
      sileo.success({
        title: 'Salonero agregado',
        description: `${nombre.trim()} — usuario de acceso: ${resultado.usuario_login}`,
      })
      setModalNuevo(false)
      setNombre('')
      setError('')
      cargar()
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo agregar el salonero' })
    } finally {
      setGuardando(false)
    }
  }

  const handleToggle = async (salonero) => {
    try {
      await toggleSalonero(salonero.id, !salonero.disponible)
      sileo.info({
        title: salonero.disponible ? 'Salonero desactivado' : 'Salonero activado',
        description: `${salonero.nombre} fue ${salonero.disponible ? 'desactivado' : 'activado'}`,
      })
      cargar()
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo cambiar el estado' })
    }
  }

  const handleCambiarPin = async () => {
    if (!pinNuevo.trim()) return
    setCambiandoPin(true)
    try {
      await cambiarPinSalonero(pinNuevo.trim())
      setPinActual(pinNuevo.trim())
      setPinNuevo('')
      sileo.success({ title: 'PIN actualizado', description: 'El PIN de acceso para saloneros fue cambiado' })
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo cambiar el PIN' })
    } finally {
      setCambiandoPin(false)
    }
  }

  const activos = saloneros.filter(s => s.disponible)
  const inactivos = saloneros.filter(s => !s.disponible)

  return (
    <PageWrapper>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Users size={40} color="var(--color-primary)" />
          <div className="ms-2">
            <h4 className="mb-0 fw-semibold" style={{ color: 'var(--color-text)' }}>Personal</h4>
            <small style={{ color: 'var(--color-text-secondary)' }}>Administra los saloneros del restaurante</small>
          </div>
        </div>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          {activos.length} activo{activos.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>

        {/* Header */}
        <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center justify-content-between mb-0">
            <span className="fw-semibold small" style={{ textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-bg)' }}>
              Saloneros
            </span>
            <div className="d-flex gap-2">
              <button
                onClick={cargar}
                disabled={cargando}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '4px 12px', color: 'var(--color-text-bg)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RefreshCw size={13} /> Actualizar
              </button>
              <button
                onClick={() => { setModalNuevo(true); setNombre(''); setError('') }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '4px 12px', color: 'var(--color-text-bg)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={14} /> Nuevo salonero
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ background: 'var(--color-surface)', padding: '1rem 1.5rem' }}>
          {cargando ? (
            <div className="text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>Cargando...</div>
          ) : saloneros.length === 0 ? (
            <div className="text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              <Users size={36} className="mb-2 opacity-25" />
              <p className="mb-0">No hay saloneros registrados.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">

              {/* Activos */}
              {activos.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <UserCheck size={18} color="var(--color-success)" />
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{s.nombre}</div>
                      {s.usuario_login && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          usuario: {s.usuario_login}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(s)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--color-danger)',
                      borderRadius: 8,
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      color: 'var(--color-danger)',
                    }}
                  >
                    Desactivar
                  </button>
                </div>
              ))}

              {/* Divisor si hay inactivos */}
              {inactivos.length > 0 && activos.length > 0 && (
                <div style={{ borderTop: '1px dashed var(--color-border)', margin: '4px 0' }} />
              )}

              {/* Inactivos */}
              {inactivos.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    opacity: 0.55,
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <UserX size={18} color="var(--color-text-secondary)" />
                    <div>
                      <div style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>{s.nombre}</div>
                      {s.usuario_login && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          usuario: {s.usuario_login}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(s)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--color-success)',
                      borderRadius: 8,
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      color: 'var(--color-success)',
                    }}
                  >
                    Activar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PIN de acceso para saloneros */}
      <div style={{ marginTop: 24, borderRadius: 16, border: '1px solid var(--color-border)', padding: '1.25rem 1.5rem' }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <KeyRound size={16} color="var(--color-text-secondary)" />
          <span className="fw-semibold small" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
            PIN de acceso para saloneros
          </span>
        </div>
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4">
            <Form.Label className="small mb-1" style={{ color: 'var(--color-text-secondary)' }}>PIN actual</Form.Label>
            <Form.Control
              disabled
              value={pinActual}
              style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
          <div className="col-12 col-md-4">
            <Form.Label className="small mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nuevo PIN</Form.Label>
            <Form.Control
              value={pinNuevo}
              onChange={e => setPinNuevo(e.target.value)}
              placeholder="Ej. 4821"
              style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
          <div className="col-12 col-md-4">
            <button
              onClick={handleCambiarPin}
              disabled={cambiandoPin || !pinNuevo.trim()}
              style={{ width: '100%', background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '7px', color: 'var(--color-text-bg)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: (cambiandoPin || !pinNuevo.trim()) ? 0.6 : 1 }}
            >
              {cambiandoPin ? 'Cambiando...' : 'Cambiar PIN'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal nuevo salonero */}
      <Modal show={modalNuevo} onHide={() => setModalNuevo(false)} centered animation={false} contentClassName="border-0 bg-transparent">
        <div style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <Users size={20} color="var(--color-text-bg)" />
                <span className="fw-bold fs-5" style={{ color: 'var(--color-text-bg)' }}>Nuevo salonero</span>
              </div>
              <button
                onClick={() => setModalNuevo(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--color-text-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>
            <div className="opacity-70 small mt-1" style={{ color: 'var(--color-text-bg)' }}>
              Ingresá el nombre del salonero. Se le creará automáticamente un usuario de acceso.
            </div>
          </div>

          <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
            {error && (
              <div className="mb-3 p-2 rounded small" style={{ background: '#fef2f2', color: '#c70009', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <Form.Label className="small fw-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Nombre
            </Form.Label>
            <Form.Control
              autoFocus
              value={nombre}
              onChange={e => { setNombre(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleCrear() }}
              placeholder="Ej. Juan Pérez"
              style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                onClick={() => setModalNuevo(false)}
                style={{ background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '7px 16px', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-btn-secondary-text)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={guardando}
                style={{ background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '7px 16px', color: 'var(--color-text-bg)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: guardando ? 0.7 : 1 }}
              >
                {guardando ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  )
}