import { useState, useEffect } from 'react'
import { Modal, Form, Row, Col } from 'react-bootstrap'
import { Package, Trash2, Plus } from 'lucide-react'
import { GRADIENTS } from '../../../constants/theme'
import { getVariantes, crearVariante, eliminarVariante } from '../../../services/productosService'

const G = GRADIENTS.naranja

export default function ProductoFormModal({ show, onHide, producto, onGuardar }) {
  const [form, setForm] = useState({
    codigo: '',
    descripcion: '',
    precio: '',
    prioridad: 0,
    categoria: 'salon',
    requiereAcompanamiento: false,
    tieneVariantes: false,
    requiereFicha: false,
  })
  const [error, setError] = useState('')

  const [variantes, setVariantes] = useState([])
  const [nuevaVariante, setNuevaVariante] = useState('')
  const [cargandoVariantes, setCargandoVariantes] = useState(false)

  useEffect(() => {
    if (show) {
      setError('')
      setForm(producto ? {
        codigo:      producto.codigo || '',
        descripcion: producto.descripcion || '',
        precio:      producto.precio || '',
        prioridad:   producto.prioridad ?? 0,
        categoria:   producto.categoria || 'salon',
        requiereAcompanamiento: producto.requiere_acompanamiento || false,
        tieneVariantes: producto.tiene_variantes || false,
        requiereFicha: producto.requiere_ficha || false,

      } : {
        codigo: '', descripcion: '', precio: '', prioridad: 0, categoria: 'salon',
        requiereAcompanamiento: false, tieneVariantes: false, requiereFicha: false,
      })
    }
  }, [show, producto])

  useEffect(() => {
    if (show && producto?.id && producto?.tiene_variantes) {
      setCargandoVariantes(true)
      getVariantes(producto.id)
        .then(setVariantes)
        .finally(() => setCargandoVariantes(false))
    } else {
      setVariantes([])
    }
  }, [show, producto])

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.descripcion.trim()) {
      setError('La descripción es obligatoria.')
      return
    }
    if (!form.precio || isNaN(form.precio) || Number(form.precio) < 0) {
      setError('Ingresá un precio válido.')
      return
    }
    setError('')
    onGuardar(form)
  }

  const handleAgregarVariante = async () => {
    if (!nuevaVariante.trim() || !producto?.id) return
    try {
      const variante = await crearVariante(producto.id, nuevaVariante.trim())
      setVariantes(prev => [...prev, variante])
      setNuevaVariante('')
    } catch {
      setError('No se pudo agregar la variante.')
    }
  }

  const handleEliminarVariante = async (varianteId) => {
    try {
      await eliminarVariante(varianteId)
      setVariantes(prev => prev.filter(v => v.id !== varianteId))
    } catch {
      setError('No se pudo eliminar la variante.')
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered animation={true} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: G, padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Package size={20} color="white" />
              <span className="fw-bold text-white fs-5">
                {producto ? 'Editar producto' : 'Nuevo producto'}
              </span>
            </div>
            <button
              onClick={onHide}
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
            {producto ? 'Modificá los datos del producto.' : 'Completá los datos para agregar un producto al catálogo.'}
          </div>
        </div>

        {/* Body */}
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
          {error && (
            <div
              className="mb-3 p-2 rounded small"
              style={{ background: '#fef2f2', color: '#c70009', border: '1px solid #fecaca' }}
            >
              {error}
            </div>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Descripción
              </Form.Label>
              <Form.Control
                value={form.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                placeholder="Ej. Trucha entera"
                style={{
                  background: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </Form.Group>

            <Row>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    Código
                  </Form.Label>
                  <Form.Control
                    value={form.codigo}
                    onChange={(e) => handleChange('codigo', e.target.value)}
                    placeholder="Ej. TRUCHAJUM01"
                    style={{
                      background: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    Precio (₡)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => handleChange('precio', e.target.value)}
                    placeholder="0"
                    style={{
                      background: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    Prioridad
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={form.prioridad}
                    onChange={(e) => handleChange('prioridad', e.target.value)}
                    style={{
                      background: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                  <Form.Text style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                    Mayor número = aparece primero en búsquedas
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    Categoría
                  </Form.Label>
                  <Form.Select
                    value={form.categoria}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    style={{
                      background: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    <option value="salon">Salón</option>
                    <option value="cocina">Cocina</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
              <span className="fw-semibold small" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Comandas
              </span>

              <Form.Check
                type="checkbox"
                id="requiere-acompanamiento"
                className="mt-2"
                label="Requiere acompañamiento (yuca, papa, patacón, etc.)"
                checked={form.requiereAcompanamiento}
                onChange={(e) => handleChange('requiereAcompanamiento', e.target.checked)}
                style={{ color: 'var(--color-text)' }}
              />
              <Form.Check
                type="checkbox"
                id="tiene-variantes"
                className="mt-2"
                label="Tiene variantes (sabores, tipos)"
                checked={form.tieneVariantes}
                onChange={(e) => handleChange('tieneVariantes', e.target.checked)}
                style={{ color: 'var(--color-text)' }}
              />
              <Form.Check
                type="checkbox"
                id="requiere-ficha"
                className="mt-2"
                label="Requiere número de ficha (truchas)"
                checked={form.requiereFicha}
                onChange={(e) => handleChange('requiereFicha', e.target.checked)}
                style={{ color: 'var(--color-text)' }}
              />

              {form.tieneVariantes && !producto?.id && (
                <div className="mt-2 small" style={{ color: 'var(--color-text-secondary)' }}>
                  Guardá el producto primero para poder agregar sus variantes.
                </div>
              )}

              {form.tieneVariantes && producto?.id && (
                <div className="mt-3">
                  {cargandoVariantes ? (
                    <div className="small" style={{ color: 'var(--color-text-secondary)' }}>Cargando variantes...</div>
                  ) : (
                    <div className="d-flex flex-column gap-2 mb-2">
                      {variantes.map(v => (
                        <div
                          key={v.id}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                        >
                          <span style={{ color: 'var(--color-text)', fontSize: '0.85rem' }}>{v.nombre}</span>
                          <button
                            type="button"
                            onClick={() => handleEliminarVariante(v.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', alignItems: 'center' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {variantes.length === 0 && (
                        <div className="small" style={{ color: 'var(--color-text-secondary)' }}>Sin variantes agregadas todavía.</div>
                      )}
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <Form.Control
                      value={nuevaVariante}
                      onChange={(e) => setNuevaVariante(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarVariante() } }}
                      placeholder="Ej. Fanta Uva"
                      style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleAgregarVariante}
                      style={{ background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '0 14px', color: 'var(--color-text-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                type="button"
                onClick={onHide}
                style={{
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  background: G,
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 16px',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {producto ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  )
}