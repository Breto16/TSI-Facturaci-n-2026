import { useNavigate } from 'react-router-dom'
import { Container, Modal, Form } from 'react-bootstrap'
import {
  Grid3x3, Receipt, Package, Users, BarChart2, Lock, Fish
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { sileo } from 'sileo'
import { getPrecioTruchaVigente, actualizarPrecioTrucha } from '../../services/truchaService'
import PageWrapper from '../../components/layout/PageWrapper'


const BANNERS = [
  {
    key: 'mesas',
    label: 'Mesas',
    descripcion: 'Ver y gestionar las mesas del restaurante',
    icono: Grid3x3,
    ruta: '/mesas',
  },
  {
    key: 'facturas',
    label: 'Facturas',
    descripcion: 'Consultar facturas por estado y fecha',
    icono: Receipt,
    ruta: '/facturas',
  },
  {
    key: 'productos',
    label: 'Productos',
    descripcion: 'Administrar el catálogo de productos',
    icono: Package,
    ruta: '/productos',
  },
  {
    key: 'personal',
    label: 'Personal',
    descripcion: 'Gestionar saloneros disponibles',
    icono: Users,
    ruta: '/personal',
  },
  {
    key: 'consultas',
    label: 'Consultas',
    descripcion: 'Reportes rápidos sin contraseña',
    icono: BarChart2,
    ruta: '/consultas',
  },
  {
    key: 'cierre',
    label: 'Cierre',
    descripcion: 'Reportes de cierre diario y ventas',
    icono: Lock,
    ruta: '/cierre',
  },
]

const BannerPrincipal = ({ banner, onClick }) => {
  const Icono = banner.icono
  const [hover, setHover] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 16,
        border: '2px solid var(--color-primary)',
        backgroundColor: hover ? 'var(--color-primary)' : 'var(--color-surface)',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        border: '2px solid var(--color-primary)',
        backgroundColor: hover ? 'rgba(255,255,255,0.15)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'background-color 0.15s ease',
      }}>
        <Icono size={24} color={hover ? '#ffffff' : 'var(--color-primary)'} />
      </div>
      <div>
        <div style={{
          fontWeight: 700,
          fontSize: '1rem',
          color: hover ? '#ffffff' : 'var(--color-primary)',
          transition: 'color 0.15s ease',
        }}>
          {banner.label}
        </div>
        <div style={{
          fontSize: '0.8rem',
          color: hover ? 'rgba(255,255,255,0.75)' : 'var(--color-text-secondary)',
          transition: 'color 0.15s ease',
          marginTop: 2,
        }}>
          {banner.descripcion}
        </div>
      </div>
    </div>
  )
}

const BannerTrucha = ({ onClick }) => {
  const [hover, setHover] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 16,
        border: '2px dashed var(--color-primary)',
        backgroundColor: hover ? 'var(--color-primary)' : 'var(--color-surface)',
        padding: '1.25rem 1.5rem',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="d-flex align-items-center gap-3">
        <Fish size={28} color={hover ? '#ffffff' : 'var(--color-primary)'} style={{ transition: 'color 0.15s ease' }} />
        <div>
          <div style={{
            fontWeight: 700,
            fontSize: '0.95rem',
            color: hover ? '#ffffff' : 'var(--color-primary)',
            transition: 'color 0.15s ease',
          }}>
            Trucha cruda
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: hover ? 'rgba(255,255,255,0.75)' : 'var(--color-text-secondary)',
            transition: 'color 0.15s ease',
          }}>
            Ajustar precio por gramo vigente
          </div>
        </div>
      </div>
      <span style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        color: hover ? 'rgba(255,255,255,0.75)' : 'var(--color-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        transition: 'color 0.15s ease',
      }}>
        Configuración
      </span>
    </div>
  )
}

export default function InicioPage() {
  const navigate = useNavigate()
  const [modalTrucha, setModalTrucha] = useState(false)
  const [precioGramo, setPrecioGramo] = useState('')
  const [errorTrucha, setErrorTrucha] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (modalTrucha) {
      setErrorTrucha('')
      getPrecioTruchaVigente()
        .then(data => {
          if (data?.precio_gramo) setPrecioGramo(String(data.precio_gramo))
        })
        .catch(() => setPrecioGramo(''))
    }
  }, [modalTrucha])

  const handleGuardarTrucha = async () => {
    if (!precioGramo || isNaN(precioGramo) || Number(precioGramo) <= 0) {
      setErrorTrucha('Ingresá un precio por gramo válido.')
      return
    }
    setGuardando(true)
    try {
      await actualizarPrecioTrucha(Number(precioGramo))
      sileo.success({ title: 'Precio actualizado', description: `Nuevo precio: ₡${Number(precioGramo).toLocaleString('es-CR')} por gramo` })
      setModalTrucha(false)
    } catch (err) {
      sileo.error({ title: 'Error', description: 'No se pudo actualizar el precio de trucha cruda' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PageWrapper centered>


      <div className="row g-3 mb-3">
        {BANNERS.map(banner => (
          <div key={banner.key} className="col-12 col-sm-6">
            <BannerPrincipal
              banner={banner}
              onClick={() => navigate(banner.ruta)}
            />
          </div>
        ))}
      </div>

      <BannerTrucha onClick={() => setModalTrucha(true)} />

      <Modal
        show={modalTrucha}
        onHide={() => setModalTrucha(false)}
        centered
        animation={false}
        contentClassName="border-0 bg-transparent"
      >
        <div style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <Fish size={20} color="white" />
                <span className="fw-bold text-white fs-5">Precio trucha cruda</span>
              </div>
              <button
                onClick={() => setModalTrucha(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            </div>
            <div className="text-white opacity-70 small mt-1">
              Ingresá el nuevo precio por gramo. Ejemplo: 5.5 = ₡5,500 por kilo.
            </div>
          </div>

          <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
            {errorTrucha && (
              <div
                className="mb-3 p-2 rounded small"
                style={{ background: '#fef2f2', color: '#c70009', border: '1px solid #fecaca' }}
              >
                {errorTrucha}
              </div>
            )}

            <Form.Label
              className="small fw-medium mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              Precio por gramo (₡)
            </Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              value={precioGramo}
              onChange={e => { setPrecioGramo(e.target.value); setErrorTrucha('') }}
              placeholder="Ej. 5.5"
              style={{
                background: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
            <Form.Text style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
              Este valor se usará para calcular el total de trucha cruda en las facturas.
            </Form.Text>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                onClick={() => setModalTrucha(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-btn-secondary-border)',
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'var(--color-btn-secondary-text)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarTrucha}
                disabled={guardando}
                style={{
                  background: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 16px',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: guardando ? 0.7 : 1,
                }}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  )
}