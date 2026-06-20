import { useState, useEffect, useCallback } from 'react'
import { Container, Form, InputGroup, Spinner, Row, Col } from 'react-bootstrap'
import { Receipt, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sileo } from 'sileo'
import { GRADIENTS } from '../../constants/theme'
import { getFacturas } from '../../services/facturasService'
import PageWrapper from '../../components/layout/PageWrapper'

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'abierta', label: 'Abierta' },
  { value: 'impresa', label: 'Impresa' },
  { value: 'dividida', label: 'Dividida' },
  { value: 'pagada', label: 'Pagada' },
  { value: 'anulada', label: 'Anulada' },
]

const ESTADO_CONFIG = {
  abierta:  { label: 'Abierta',  color: '#dc2626', bg: '#fef2f2' },
  impresa:  { label: 'Impresa',  color: '#92400e', bg: '#fef3c7' },
  dividida: { label: 'Dividida', color: '#0891b2', bg: '#e0f2fe' },
  pagada:   { label: 'Pagada',   color: '#1c530d', bg: '#dcfce7' },
  anulada:  { label: 'Anulada',  color: '#4a5568', bg: '#f3f4f6' },
}

const hoy = () => new Date().toISOString().split('T')[0]

export default function FacturasPage() {
  const navigate = useNavigate()
  const [facturas, setFacturas] = useState([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState('')
  const [fechaDesde, setFechaDesde] = useState(hoy())
  const [fechaHasta, setFechaHasta] = useState(hoy())
  const LIMIT = 20

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const params = { pagina }
      if (estado) params.estados = estado
      if (fechaDesde) params.fechaDesde = fechaDesde
      if (fechaHasta) params.fechaHasta = fechaHasta

      const data = await getFacturas(params)
      setFacturas(data.facturas)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudieron cargar las facturas' })
    } finally {
      setCargando(false)
    }
  }, [pagina, estado, fechaDesde, fechaHasta])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => { setPagina(1) }, [estado, fechaDesde, fechaHasta])

  const totalPaginas = Math.ceil(total / LIMIT)

  const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleString('es-CR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <PageWrapper>

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Receipt size={40} color="var(--color-primary)" />
          <div className="ms-2">
            <h4 className="mb-0 fw-semibold" style={{ color: 'var(--color-text)' }}>
              Facturas
            </h4>
            <small style={{ color: 'var(--color-text-secondary)' }}>
              Consultá el historial de facturas
            </small>
          </div>
        </div>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          {total} factura{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>

        <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className="fw-semibold small" style={{ textTransform: 'uppercase', letterSpacing: 1 , color: 'var(--color-text-bg)' }}>
              Historial
            </span>
          </div>

          <Row className="g-2">
            <Col xs={12} md={4}>
              <Form.Select
                size="sm"
                value={estado}
                onChange={e => setEstado(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'var(--color-text-bg)', fontSize: '0.875rem' }}
              >
                {ESTADOS.map(e => (
                  <option key={e.value} value={e.value} style={{ color: 'black' }}>{e.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} md={4}>
              <Form.Control
                size="sm"
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'var(--color-text-bg)', fontSize: '0.875rem' }}
              />
            </Col>
            <Col xs={6} md={4}>
              <Form.Control
                size="sm"
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'var(--color-text-bg)', fontSize: '0.875rem' }}
              />
            </Col>
          </Row>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '0 0 1rem' }}>
          {cargando ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : facturas.length === 0 ? (
            <div className="text-center py-5" style={{ color: 'var(--color-text-secondary)' }}>
              <Receipt size={36} className="mb-2 opacity-25" />
              <p className="mb-0">No se encontraron facturas.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      {['#', 'Mesa', 'Detalle', 'Salonero', 'Apertura', 'Total', 'Estado'].map(h => (
                        <th key={h} className="fw-bold border-0 ps-4" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}>
                          {h}
                        </th>
                      ))}
                      <th className="border-0" style={{ backgroundColor: 'var(--color-surface)' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.map(f => {
                      const cfg = ESTADO_CONFIG[f.estado] || ESTADO_CONFIG.abierta
                      return (
                        <tr
                          key={f.id}
                          style={{ cursor: 'pointer', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                          onClick={() => navigate(`/facturas/${f.id}`)}
                        >
                          <td className="ps-4" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                            #{f.id}
                          </td>
                          <td>{f.mesa_nombre || '—'}</td>
                          <td>
                            {f.detalle || <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Sin detalle</span>}
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>{f.salonero_nombre || '—'}</td>
                          <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                            {formatFecha(f.fecha_apertura)}
                          </td>
                          <td className="fw-medium">₡{Number(f.total).toLocaleString('es-CR')}</td>
                          <td>
                            <span style={{
                              background: cfg.bg,
                              color: cfg.color,
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                            }}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="pe-3" style={{ color: 'var(--color-text-secondary)' }}>›</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPaginas > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-1 mt-3">
                  <button
                    disabled={pagina === 1}
                    onClick={() => setPagina(p => p - 1)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: '0.8rem',
                      cursor: pagina === 1 ? 'default' : 'pointer',
                      color: pagina === 1 ? 'var(--color-text-secondary)' : 'var(--color-primary)',
                    }}
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`e-${i}`} style={{ color: 'var(--color-text-secondary)', padding: '0 4px', fontSize: '0.8rem' }}>...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPagina(p)}
                          style={{
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: p === pagina ? 600 : 400,
                            background: p === pagina ? 'var(--color-primary)' : 'none',
                            color: p === pagina ? 'white' : 'var(--color-text)',
                          }}
                        >
                          {p}
                        </button>
                      )
                    )
                  }

                  <button
                    disabled={pagina === totalPaginas}
                    onClick={() => setPagina(p => p + 1)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: '0.8rem',
                      cursor: pagina === totalPaginas ? 'default' : 'pointer',
                      color: pagina === totalPaginas ? 'var(--color-text-secondary)' : 'var(--color-primary)',
                    }}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}