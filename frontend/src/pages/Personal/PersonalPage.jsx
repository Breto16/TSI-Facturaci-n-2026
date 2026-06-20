import { useState, useEffect, useCallback } from 'react'
import { Container, Modal, Form } from 'react-bootstrap'
import { Users, Plus, RefreshCw, UserCheck, UserX } from 'lucide-react'
import { sileo } from 'sileo'
import { GRADIENTS } from '../../constants/theme'
import { getSaloneros, crearSalonero, toggleSalonero } from '../../services/salonerosService'
import PageWrapper from '../../components/layout/PageWrapper'


const GRADIENTE = GRADIENTS.bosque

export default function PersonalPage() {
  const [saloneros, setSaloneros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

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

  const handleCrear = async () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setGuardando(true)
    try {
      await crearSalonero(nombre.trim())
      sileo.success({ title: 'Salonero agregado', description: `${nombre.trim()} fue agregado al sistema` })
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
                    <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{s.nombre}</span>
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
                    <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>{s.nombre}</span>
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
              Ingresá el nombre del salonero para agregarlo al sistema.
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