import { useState, useEffect, useCallback } from 'react'
import { Container, Spinner } from 'react-bootstrap'
import { BarChart2, Package, Percent, Plus, Trash2 } from 'lucide-react'
import { sileo } from 'sileo'
import PageWrapper from '../../components/layout/PageWrapper'
import { GRADIENTS } from '../../constants/theme'
import SelectorProductosPills from './components/SelectorProductosPills'
import ConsultaRapidaModal from './components/ConsultaRapidaModal'
import {
  ventaPorProductos, servicioPorSalonero,
  getConsultasRapidas, eliminarConsultaRapida
} from '../../services/consultasService'
import { getSaloneros } from '../../services/salonerosService'
import { getProductos } from '../../services/productosService'

const hoy = () => new Date().toISOString().split('T')[0]

export default function ConsultasPage() {
  const [tab, setTab] = useState('producto')
  const [consultasRapidas, setConsultasRapidas] = useState([])
  const [modalRapida, setModalRapida] = useState(false)

  const [fechaDesde, setFechaDesde] = useState(hoy())
  const [fechaHasta, setFechaHasta] = useState(hoy())

  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const [saloneros, setSaloneros] = useState([])
  const [saloneroId, setSaloneroId] = useState('')

  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)

  const cargarConsultasRapidas = useCallback(async () => {
    try {
      const data = await getConsultasRapidas()
      setConsultasRapidas(data)
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudieron cargar las consultas rápidas' })
    }
  }, [])

  useEffect(() => {
    cargarConsultasRapidas()
    getSaloneros().then(setSaloneros)
  }, [cargarConsultasRapidas])

  useEffect(() => {
    setResultado(null)
  }, [tab])

  const ejecutarConsultaProducto = async (productoIds) => {
    if (productoIds.length === 0) {
      sileo.warning({ title: 'Sin productos', description: 'Seleccioná al menos un producto' })
      return
    }
    setCargando(true)
    try {
      const data = await ventaPorProductos(productoIds, fechaDesde, fechaHasta)
      setResultado({ tipo: 'producto', ...data })
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo ejecutar la consulta' })
    } finally {
      setCargando(false)
    }
  }

  const ejecutarConsultaServicio = async () => {
    if (!saloneroId) {
      sileo.warning({ title: 'Sin salonero', description: 'Seleccioná un salonero' })
      return
    }
    setCargando(true)
    try {
      const data = await servicioPorSalonero(saloneroId, fechaDesde, fechaHasta)
      setResultado({ tipo: 'servicio', ...data })
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo ejecutar la consulta' })
    } finally {
      setCargando(false)
    }
  }

  const ejecutarConsultaRapida = async (consulta) => {
    setCargando(true)
    try {
      const data = await ventaPorProductos(consulta.producto_ids, fechaDesde, fechaHasta)
      setResultado({ tipo: 'producto', ...data })
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo ejecutar la consulta' })
    } finally {
      setCargando(false)
    }
  }

  const handleEliminarRapida = async (id, titulo, e) => {
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar la consulta "${titulo}"?`)) return
    try {
      await eliminarConsultaRapida(id)
      sileo.info({ title: 'Eliminada', description: `"${titulo}" fue eliminada` })
      cargarConsultasRapidas()
      if (tab === `rapida_${id}`) setTab('producto')
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo eliminar' })
    }
  }

  const TABS_BASE = [
    { key: 'producto', label: 'Venta de producto', icono: Package },
    { key: 'servicio', label: 'Servicio 10%', icono: Percent },
  ]

  return (
    <PageWrapper>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <BarChart2 size={40} color="var(--color-primary)" />
          <div className="ms-2">
            <h4 className="mb-0 fw-semibold" style={{ color: 'var(--color-text)' }}>Consultas</h4>
            <small style={{ color: 'var(--color-text-secondary)' }}>Reportes rápidos del sistema</small>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {TABS_BASE.map(t => {
          const Icono = t.icono
          const activo = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 20,
                border: `1px solid ${activo ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: activo ? 'var(--color-primary)' : 'var(--color-surface)',
                color: activo ? 'var(--color-text-bg)' : 'var(--color-text)',
                fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Icono size={14} /> {t.label}
            </button>
          )
        })}

        {consultasRapidas.map(c => {
          const key = `rapida_${c.id}`
          const activo = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 10px 7px 14px', borderRadius: 20,
                border: `1px solid ${activo ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: activo ? 'var(--color-primary)' : 'var(--color-surface)',
                color: activo ? 'var(--color-text-bg)' : 'var(--color-text)',
                fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
              }}
            >
              {c.titulo}
              <span
                onClick={(e) => handleEliminarRapida(c.id, c.titulo, e)}
                style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}
              >
                <Trash2 size={12} />
              </span>
            </button>
          )
        })}

        <button
          onClick={() => setModalRapida(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 20,
            border: '2px dashed var(--color-primary)',
            background: 'transparent', color: 'var(--color-primary)',
            fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Nueva
        </button>
      </div>

      {/* Card de filtros + resultados */}
      <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ background: "var(--color-primary)", padding: '1.25rem 1.5rem' }}>

          <div className="row g-2 mb-3">
            <div className="col-6 col-md-3">
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'var(--color-text-bg)', fontSize: '0.85rem' }}
              />
            </div>
            <div className="col-6 col-md-3">
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'var(--color-text-bg)', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {tab === 'producto' && (
            <div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10 }}>
                <SelectorProductosPills
                  seleccionados={productosSeleccionados}
                  onChange={setProductosSeleccionados}
                />
              </div>
              <button
                onClick={() => ejecutarConsultaProducto(productosSeleccionados.map(p => p.id))}
                style={{ marginTop: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '7px 16px', color: 'var(--color-text-bg)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Consultar
              </button>
            </div>
          )}

          {tab === 'servicio' && (
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <select
                value={saloneroId}
                onChange={e => setSaloneroId(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'var(--color-text-bg)', fontSize: '0.85rem' }}
              >
                <option value="" style={{ color: 'black' }}>Seleccionar salonero...</option>
                {saloneros.map(s => (
                  <option key={s.id} value={s.id} style={{ color: 'black' }}>{s.nombre}</option>
                ))}
              </select>
              <button
                onClick={ejecutarConsultaServicio}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '7px 16px', color: 'var(--color-text-bg)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Consultar
              </button>
            </div>
          )}

          {tab.startsWith('rapida_') && (
            <button
              onClick={() => {
                const id = parseInt(tab.replace('rapida_', ''))
                const consulta = consultasRapidas.find(c => c.id === id)
                if (consulta) ejecutarConsultaRapida(consulta)
              }}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '7px 16px', color: 'var(--color-text-bg)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Consultar
            </button>
          )}
        </div>

        {/* Resultados */}
        <div style={{ background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
          {cargando ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : !resultado ? (
            <div className="text-center py-5" style={{ color: 'var(--color-text-secondary)' }}>
              Configurá los filtros y presioná Consultar
            </div>
          ) : (
            <>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)' }}>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      {resultado.tipo === 'producto' ? (
                        <>
                          <th style={{ padding: '8px 16px', color: 'var(--color-text-secondary)' }}>Factura #</th>
                          <th style={{ padding: '8px 16px', color: 'var(--color-text-secondary)' }}>Producto</th>
                          <th style={{ padding: '8px 16px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Cantidad</th>
                          <th style={{ padding: '8px 16px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Total</th>
                        </>
                      ) : (
                        <>
                          <th style={{ padding: '8px 16px', color: 'var(--color-text-secondary)' }}>Factura #</th>
                          <th style={{ padding: '8px 16px', color: 'var(--color-text-secondary)' }}>Fecha</th>
                          <th style={{ padding: '8px 16px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Servicio 10%</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          Sin resultados en este rango
                        </td>
                      </tr>
                    ) : resultado.rows.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                        {resultado.tipo === 'producto' ? (
                          <>
                            <td style={{ padding: '7px 16px' }}>#{r.factura_id}</td>
                            <td style={{ padding: '7px 16px' }}>{r.descripcion}</td>
                            <td style={{ padding: '7px 16px', textAlign: 'center' }}>{r.cantidad}</td>
                            <td style={{ padding: '7px 16px', textAlign: 'right', fontWeight: 600 }}>₡{Number(r.total).toLocaleString('es-CR')}</td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '7px 16px' }}>#{r.factura_id}</td>
                            <td style={{ padding: '7px 16px', color: 'var(--color-text-secondary)' }}>
                              {new Date(r.fecha_apertura).toLocaleDateString('es-CR')}
                            </td>
                            <td style={{ padding: '7px 16px', textAlign: 'right', fontWeight: 600 }}>₡{Number(r.servicio).toLocaleString('es-CR')}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total fijo abajo */}
              <div style={{
                padding: '14px 20px',
                borderTop: '2px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--color-background)',
              }}>
                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-primary)' }}>
                  ₡{Number(resultado.total).toLocaleString('es-CR')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <ConsultaRapidaModal
        show={modalRapida}
        onHide={() => setModalRapida(false)}
        onCreada={cargarConsultasRapidas}
      />
    </PageWrapper>
  )
}