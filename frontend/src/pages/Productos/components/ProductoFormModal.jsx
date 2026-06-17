import { useState, useEffect } from 'react'
import { Modal, Form, Row, Col } from 'react-bootstrap'
import { Package } from 'lucide-react'
import { GRADIENTS } from '../../../constants/theme'

const G = GRADIENTS.naranja

export default function ProductoFormModal({ show, onHide, producto, onGuardar }) {
  const [form, setForm] = useState({
    codigo: '',
    descripcion: '',
    precio: '',
    prioridad: 0,
    categoria: 'salon',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (show) {
      setError('')
      setForm(producto ? {
        codigo:      producto.codigo || '',
        descripcion: producto.descripcion || '',
        precio:      producto.precio || '',
        prioridad:   producto.prioridad ?? 0,
        categoria:   producto.categoria || 'salon',
      } : { codigo: '', descripcion: '', precio: '', prioridad: 0, categoria: 'salon' })
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
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
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