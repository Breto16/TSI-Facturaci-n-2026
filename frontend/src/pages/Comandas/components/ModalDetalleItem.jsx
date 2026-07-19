import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import { Minus, Plus } from 'lucide-react'

const ACOMPANAMIENTOS = [
  { value: 'yuca', label: 'Yuca' },
  { value: 'papa', label: 'Papa' },
  { value: 'patacon', label: 'Patacón' },
  { value: 'especial', label: 'Especial' },
  { value: 'solo', label: 'Solo(a)' },
]

export default function ModalDetalleItem({ show, producto, varianteInicial, onHide, onConfirmar }) {
  const [cantidad, setCantidad] = useState(1)
  const [acompanamiento, setAcompanamiento] = useState(null)
  const [detalle, setDetalle] = useState('')
  const [saleAntes, setSaleAntes] = useState(false)

  useEffect(() => {
    if (show) {
      setCantidad(1)
      setAcompanamiento(null)
      setDetalle('')
      setSaleAntes(false)
    }
  }, [show, producto?.id])

  if (!producto) return null

  const faltaAcompanamiento = producto.requiere_acompanamiento && !acompanamiento
  const esCocina = producto.categoria === 'cocina'

  const handleConfirmar = () => {
    onConfirmar({
      productoId: producto.id,
      descripcion: producto.descripcion,
      cantidad,
      categoria: producto.categoria,
      variante: varianteInicial || null,
      acompanamiento: acompanamiento || null,
      detalle: detalle.trim() || null,
      saleAntes: esCocina ? saleAntes : false,
    })
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" animation={false} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-primary)', padding: '1.5rem' }}>
          <span className="fw-bold fs-4" style={{ color: 'var(--color-text-bg)' }}>
            {producto.descripcion}
          </span>
          {varianteInicial && (
            <div style={{ color: 'var(--color-text-bg)', opacity: 0.85, fontSize: '1rem', marginTop: 4 }}>
              {varianteInicial}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '2rem', minHeight: '40vh' }}>

          <label className="fw-medium mb-2 d-block" style={{ color: 'var(--color-text)' }}>
            Cantidad
          </label>
          <div className="d-flex align-items-center gap-3 mb-4">
            <button
              onClick={() => setCantidad(c => Math.max(1, c - 1))}
              style={{ width: 48, height: 48, borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Minus size={20} />
            </button>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', minWidth: 44, textAlign: 'center' }}>
              {cantidad}
            </span>
            <button
              onClick={() => setCantidad(c => c + 1)}
              style={{ width: 48, height: 48, borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Plus size={20} />
            </button>
          </div>

          {producto.requiere_acompanamiento && (
            <>
              <label className="fw-medium mb-2 d-block" style={{ color: 'var(--color-text)' }}>
                Acompañamiento
              </label>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {ACOMPANAMIENTOS.map(op => (
                  <button
                    key={op.value}
                    onClick={() => setAcompanamiento(op.value)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      border: `1px solid ${acompanamiento === op.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: acompanamiento === op.value ? 'var(--color-primary)' : 'transparent',
                      color: acompanamiento === op.value ? 'var(--color-text-bg)' : 'var(--color-text)',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {esCocina && (
            <label className="d-flex align-items-center gap-2 mb-4" style={{ color: 'var(--color-text)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={saleAntes}
                onChange={e => setSaleAntes(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--color-primary)' }}
              />
              <span style={{ fontWeight: 600 }}>Sale antes</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                (bebida caliente, entrada — imprime en ticket aparte de cocina)
              </span>
            </label>
          )}

          <label className="fw-medium mb-2 d-block mt-1" style={{ color: 'var(--color-text)' }}>
            Notas (opcional)
          </label>
          <textarea
            value={detalle}
            onChange={e => setDetalle(e.target.value)}
            placeholder="Ej: sin ensalada, agregar plátano maduro"
            rows={3}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '1rem', marginBottom: 20, resize: 'none' }}
          />

          <div className="d-flex justify-content-end gap-2">
            <button
              onClick={onHide}
              style={{ background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 10, padding: '10px 22px', fontSize: '1rem', cursor: 'pointer', color: 'var(--color-btn-secondary-text)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={faltaAcompanamiento}
              style={{ background: 'var(--color-primary)', border: 'none', borderRadius: 10, padding: '10px 22px', color: 'var(--color-text-bg)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', opacity: faltaAcompanamiento ? 0.5 : 1 }}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}