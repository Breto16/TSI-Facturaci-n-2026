import { useState, useEffect } from 'react'
import { Modal, Form } from 'react-bootstrap'
import { Sparkles } from 'lucide-react'
import { sileo } from 'sileo'
import { GRADIENTS } from '../../../constants/theme'
import { getProductosParaConsultas } from '../../../services/productosService'
import { crearConsultaRapida } from '../../../services/consultasService'

export default function ConsultaRapidaModal({ show, onHide, onCreada }) {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [titulo, setTitulo] = useState('')
  const [seleccionados, setSeleccionados] = useState([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (show) {
      getProductosParaConsultas().then(setProductos)
      setTitulo('')
      setSeleccionados([])
      setBusqueda('')
      setError('')
    }
  }, [show])

  const toggle = (producto) => {
    setSeleccionados(prev =>
      prev.find(p => p.codigo === producto.codigo)
        ? prev.filter(p => p.codigo !== producto.codigo)
        : [...prev, producto]
    )
  }
  const filtrados = productos.filter(p =>
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleGuardar = async () => {
    if (!titulo.trim()) {
      setError('El título es obligatorio.')
      return
    }
    if (seleccionados.length === 0) {
      setError('Seleccioná al menos un producto.')
      return
    }
    setGuardando(true)
    try {
      await crearConsultaRapida(titulo.trim(), seleccionados.map(p => p.codigo))
      sileo.success({ title: 'Consulta creada', description: `"${titulo.trim()}" fue guardada` })
      onCreada()
      onHide()
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo crear la consulta rápida' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered animation={false} size="lg" contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Sparkles size={20} color="white" />
              <span className="fw-bold text-white fs-5">Nueva consulta rápida</span>
            </div>
            <button onClick={onHide} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div className="text-white opacity-70 small mt-1">
            Guardá un grupo de productos para consultarlos rápido después.
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
          {error && (
            <div className="mb-3 p-2 rounded small" style={{ background: '#fef2f2', color: '#c70009', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <Form.Label className="small fw-medium mb-1" style={{ color: 'var(--color-text)' }}>Título</Form.Label>
          <Form.Control
            value={titulo}
            onChange={e => { setTitulo(e.target.value); setError('') }}
            placeholder="Ej. Postres"
            className="mb-3"
            style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />

          <Form.Label className="small fw-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Productos ({seleccionados.length} seleccionados)
          </Form.Label>
          <Form.Control
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="mb-2"
            style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />

          <div style={{
            maxHeight: 260,
            overflowY: 'auto',
            borderRadius: 10,
            border: '1px solid var(--color-border)',
          }}>
            {filtrados.map(p => {
              const checked = !!seleccionados.find(s => s.codigo === p.codigo)
              return (
                <div key={p.codigo} onClick={() => toggle(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: checked ? 'var(--color-background)' : 'transparent',
                  }}
                >
                  <input type="checkbox" checked={checked} readOnly />
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>{p.descripcion}</span>
                </div>
              )
            })}
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button onClick={onHide} style={{ background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '7px 16px', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-btn-secondary-text)' }}>
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              style={{ background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '7px 16px', color: 'var(--color-text-bg)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: guardando ? 0.7 : 1 }}
            >
              {guardando ? 'Guardando...' : 'Crear consulta'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}