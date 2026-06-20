import { useState, useEffect, useCallback } from 'react'
import { Spinner } from 'react-bootstrap'
import { Lock, Settings } from 'lucide-react'
import { sileo } from 'sileo'
import PageWrapper from '../../components/layout/PageWrapper'
import { GRADIENTS } from '../../constants/theme'
import ModalRealizarCierre from './components/ModalRealizarCierre'
import ModalConfigurarCierre from './components/ModalConfigurarCierre'
import { getCierre, ventaPorProductos, getConsultasRapidas } from '../../services/consultasService'

const hoy = () => new Date().toISOString().split('T')[0]

export default function CierrePage() {
  const [fechaDesde, setFechaDesde] = useState(hoy())
  const [fechaHasta, setFechaHasta] = useState(hoy())
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [modalCierre, setModalCierre] = useState(false)
  const [modalConfig, setModalConfig] = useState(false)
  const [consultasSeleccionadas, setConsultasSeleccionadas] = useState([])
  const [consultasResultados, setConsultasResultados] = useState([])

  const consultar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await getCierre(fechaDesde, fechaHasta)
      setDatos(data)
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo consultar el cierre' })
    } finally {
      setCargando(false)
    }
  }, [fechaDesde, fechaHasta])

  useEffect(() => { consultar() }, [consultar])


  useEffect(() => {
    getConsultasRapidas().then(consultas => {
      setConsultasSeleccionadas(consultas.map(c => c.id))
    })
  }, [])

  const abrirModalCierre = async () => {
    if (consultasSeleccionadas.length > 0) {
      const todasConsultas = await getConsultasRapidas()
      const resultados = []
      for (const id of consultasSeleccionadas) {
        const c = todasConsultas.find(x => x.id === id)
        if (c) {
          const r = await ventaPorProductos(c.producto_codigos, fechaDesde, fechaHasta)
          resultados.push({ titulo: c.titulo, total: r.total })
        }
      }
      setConsultasResultados(resultados)
    } else {
      setConsultasResultados([])
    }
    setModalCierre(true)
  }

  const totales = datos?.totales
  const servicios = datos?.servicios || []

  return (
    <PageWrapper>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Lock size={40} color="var(--color-primary)" />
          <div className="ms-2">
            <h4 className="mb-0 fw-semibold" style={{ color: 'var(--color-text)' }}>Cierre</h4>
            <small style={{ color: 'var(--color-text-secondary)' }}>Reportes y cierre de caja diario</small>
          </div>
        </div>
        <button
          onClick={() => setModalConfig(true)}
          style={{ background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '6px 14px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--color-btn-secondary-text)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Settings size={14} /> Configurar
        </button>
      </div>

      <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
          <div className="row g-2">
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
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
          {cargando ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : totales ? (
            <>
              <div className="d-flex flex-column gap-3 mb-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Total pagadas (con trucha cruda)</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>
                    ₡{(Number(totales.total_general) + Number(totales.total_trucha)).toLocaleString('es-CR')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Total pagadas (sin trucha cruda)</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>
                    ₡{Number(totales.total_general).toLocaleString('es-CR')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Total trucha cruda</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>
                    ₡{Number(totales.total_trucha).toLocaleString('es-CR')}
                  </span>
                </div>
              </div>

              {servicios.length > 0 && (
                <div className="mb-4">
                  <span className="fw-semibold small" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Servicio 10% por salonero
                  </span>
                  <div className="d-flex flex-column gap-1 mt-2">
                    {servicios.map(s => (
                      <div key={s.salonero_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0' }}>
                        <span style={{ color: 'var(--color-text)' }}>{s.salonero_nombre}</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>₡{Number(s.total_servicio).toLocaleString('es-CR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={abrirModalCierre}
                style={{ width: '100%', background: 'var(--color-primary)', border: 'none', borderRadius: 10, padding: '12px', color: 'var(--color-text-bg)', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Hacer Cierre
              </button>
            </>
          ) : (
            <div className="text-center py-5" style={{ color: 'var(--color-text-secondary)' }}>
              Sin datos para este rango
            </div>
          )}
        </div>
      </div>

      <ModalRealizarCierre
        show={modalCierre}
        onHide={() => setModalCierre(false)}
        fecha={fechaHasta}
        totales={totales}
        servicios={servicios}
        consultasIncluidas={consultasResultados}
      />

      <ModalConfigurarCierre
        show={modalConfig}
        onHide={() => setModalConfig(false)}
        seleccionadas={consultasSeleccionadas}
        onChange={setConsultasSeleccionadas}
      />
    </PageWrapper>
  )
}