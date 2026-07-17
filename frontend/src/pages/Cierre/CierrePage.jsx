import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from 'react-bootstrap'
import { Lock, Settings } from 'lucide-react'
import { sileo } from 'sileo'
import PageWrapper from '../../components/layout/PageWrapper'
import ModalRealizarCierre from './components/ModalRealizarCierre'
import ModalConfigurarCierre from './components/ModalConfigurarCierre'
import ModalPasswordCierre from './components/ModalPasswordCierre'
import CardConsultaRapida from './components/CardConsultaRapida'
import { getCierre, getConsultasRapidas } from '../../services/consultasService'

const hoy = () => new Date().toISOString().split('T')[0]

export default function CierrePage() {
  const navigate = useNavigate()

  const [desbloqueado, setDesbloqueado] = useState(false)
  const [modalCierre, setModalCierre] = useState(false)
  const [modalConfig, setModalConfig] = useState(false)

  // Consultas rápidas (cards + checklist de inclusión en el ticket)
  const [consultasRapidas, setConsultasRapidas] = useState([])
  const [consultasSeleccionadas, setConsultasSeleccionadas] = useState([])
  const [consultasResultados, setConsultasResultados] = useState({})

  useEffect(() => {
    getConsultasRapidas().then(consultas => {
      setConsultasRapidas(consultas)
      setConsultasSeleccionadas(consultas.map(c => c.id))
    })
  }, [])

  const handleResultadoConsulta = useCallback((id, datos) => {
    setConsultasResultados(prev => ({ ...prev, [id]: datos }))
  }, [])

  // Sección Cierre (totales), rango propio
  const [cierreFechaDesde, setCierreFechaDesde] = useState(hoy())
  const [cierreFechaHasta, setCierreFechaHasta] = useState(hoy())
  const [totales, setTotales] = useState(null)
  const [cargandoCierre, setCargandoCierre] = useState(false)

  const consultarCierre = useCallback(async () => {
    setCargandoCierre(true)
    try {
      const data = await getCierre(cierreFechaDesde, cierreFechaHasta)
      setTotales(data.totales)
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo consultar el cierre' })
    } finally {
      setCargandoCierre(false)
    }
  }, [cierreFechaDesde, cierreFechaHasta])

  useEffect(() => { consultarCierre() }, [consultarCierre])

  // Sección Servicio 10%, rango propio
  const [servicioFechaDesde, setServicioFechaDesde] = useState(hoy())
  const [servicioFechaHasta, setServicioFechaHasta] = useState(hoy())
  const [servicios, setServicios] = useState([])
  const [cargandoServicio, setCargandoServicio] = useState(false)

  const consultarServicio = useCallback(async () => {
    setCargandoServicio(true)
    try {
      const data = await getCierre(servicioFechaDesde, servicioFechaHasta)
      setServicios(data.servicios || [])
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo consultar el servicio 10%' })
    } finally {
      setCargandoServicio(false)
    }
  }, [servicioFechaDesde, servicioFechaHasta])

  useEffect(() => { consultarServicio() }, [consultarServicio])

  const serviciosOrdenados = [...servicios].sort((a, b) => {
    const aNoAsignado = a.salonero_nombre?.toLowerCase().includes('no asignado')
    const bNoAsignado = b.salonero_nombre?.toLowerCase().includes('no asignado')
    if (aNoAsignado && !bNoAsignado) return -1
    if (!aNoAsignado && bNoAsignado) return 1
    return 0
  })
  const totalServicio = servicios.reduce((acc, s) => acc + Number(s.total_servicio), 0)

  const consultasIncluidas = consultasSeleccionadas
    .map(id => consultasResultados[id])
    .filter(Boolean)

  if (!desbloqueado) {
    return (
      <ModalPasswordCierre
        show={true}
        onValidado={() => setDesbloqueado(true)}
        onCancelar={() => navigate('/')}
      />
    )
  }

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

      <div className="d-flex flex-column gap-4">

        {/* Cards de consultas rápidas, 100% del ancho */}
        {consultasRapidas.filter(c => consultasSeleccionadas.includes(c.id)).length > 0 && (
          <div className="d-flex flex-wrap gap-3">
            {consultasRapidas
              .filter(c => consultasSeleccionadas.includes(c.id))
              .map(c => (
                <CardConsultaRapida
                  key={c.id}
                  consulta={c}
                  onResultado={handleResultadoConsulta}
                />
              ))}
          </div>
        )}

        <div className="row g-4">
          {/* Cierre, 60% */}
          <div className="col-12 col-lg-7">
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', height: '100%' }}>
              <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="date"
                      value={cierreFechaDesde}
                      onChange={e => setCierreFechaDesde(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'var(--color-text-bg)', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="date"
                      value={cierreFechaHasta}
                      onChange={e => setCierreFechaHasta(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'var(--color-text-bg)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
                {cargandoCierre ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
                  </div>
                ) : totales ? (
                  <div className="d-flex flex-column gap-3">
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
                ) : (
                  <div className="text-center py-5" style={{ color: 'var(--color-text-secondary)' }}>
                    Sin datos para este rango
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Servicio 10%, 40% */}
          <div className="col-12 col-lg-5">
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="date"
                      value={servicioFechaDesde}
                      onChange={e => setServicioFechaDesde(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'var(--color-text-bg)', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="date"
                      value={servicioFechaHasta}
                      onChange={e => setServicioFechaHasta(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'var(--color-text-bg)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '1.5rem', flex: 1 }}>
  {cargandoServicio ? (
    <div className="text-center py-5">
      <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
    </div>
  ) : servicios.length > 0 ? (
    <div style={{ maxHeight: 120, overflowY: 'auto' }}>
      <div className="d-flex flex-column gap-2">
        {serviciosOrdenados.map(s => (
          <div key={s.salonero_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span style={{ color: 'var(--color-text)' }}>{s.salonero_nombre}</span>
            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>₡{Number(s.total_servicio).toLocaleString('es-CR')}</span>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="text-center py-5" style={{ color: 'var(--color-text-secondary)' }}>
      Sin servicio 10% en este rango
    </div>
  )}
</div>

              <div style={{
                padding: '14px 20px',
                borderTop: '2px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--color-background)',
              }}>
                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Total 10%</span>
                <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-primary)' }}>
                  ₡{totalServicio.toLocaleString('es-CR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setModalCierre(true)}
          style={{ width: '100%', background: 'var(--color-primary)', border: 'none', borderRadius: 10, padding: '12px', color: 'var(--color-text-bg)', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Hacer Cierre
        </button>
      </div>

      <ModalRealizarCierre
        show={modalCierre}
        onHide={() => setModalCierre(false)}
        fecha={cierreFechaHasta}
        totales={totales}
        servicios={servicios}
        consultasIncluidas={consultasIncluidas}
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