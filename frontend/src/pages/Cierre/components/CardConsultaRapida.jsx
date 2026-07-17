import { useState, useEffect } from 'react'
import { Spinner } from 'react-bootstrap'
import { ventaPorProductos } from '../../../services/consultasService'

const hoy = () => new Date().toISOString().split('T')[0]

export default function CardConsultaRapida({ consulta, onResultado }) {
  const [fechaDesde, setFechaDesde] = useState(hoy())
  const [fechaHasta, setFechaHasta] = useState(hoy())
  const [cargando, setCargando] = useState(false)
  const [datos, setDatos] = useState({ cantidad: 0, total: 0 })

  useEffect(() => {
    let activo = true

    const consultar = async () => {
      setCargando(true)
      try {
        const r = await ventaPorProductos(consulta.producto_codigos, fechaDesde, fechaHasta)
        if (!activo) return
        const nuevosDatos = { cantidad: r.totalArticulos || 0, total: r.total || 0 }
        setDatos(nuevosDatos)
        onResultado(consulta.id, { titulo: consulta.titulo, ...nuevosDatos })
      } catch {
        if (activo) setDatos({ cantidad: 0, total: 0 })
      } finally {
        if (activo) setCargando(false)
      }
    }

    consultar()
    return () => { activo = false }
  }, [consulta.id, consulta.producto_codigos, consulta.titulo, fechaDesde, fechaHasta, onResultado])

  return (
    <div style={{
      flex: '1 1 280px',
      minWidth: 280,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
        <div className="fw-bold fs-5 mb-2" style={{ color: 'var(--color-text-bg)' }}>
          {consulta.titulo}
        </div>
        <div className="row g-2">
          <div className="col-6">
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'var(--color-text-bg)', fontSize: '0.85rem' }}
            />
          </div>
          <div className="col-6">
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'var(--color-text-bg)', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', padding: '0.75rem 1.5rem' }}>
        {cargando ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" style={{ color: 'var(--color-primary)' }} />
          </div>
        ) : (
          <div className="d-flex justify-content-between align-items-end">
            <div>
              <div style={{ color: 'var(--color-text-secondary)' }}>Vendidos</div>
              <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--color-text)' }}>{datos.cantidad}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--color-text-secondary)' }}>Monto Total</div>
              <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--color-primary)' }}>
                ₡{Number(datos.total).toLocaleString('es-CR')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}