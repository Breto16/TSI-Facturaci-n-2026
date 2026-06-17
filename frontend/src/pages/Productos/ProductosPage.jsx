import { useState, useEffect, useCallback } from 'react'
import { Container, Form, InputGroup, Spinner } from 'react-bootstrap'
import { Package, Plus, Search, RefreshCw } from 'lucide-react'
import { sileo } from 'sileo'
import { GRADIENTS } from '../../constants/theme'
import ProductosTable from './components/ProductosTable'
import ProductoFormModal from './components/ProductoFormModal'
import PageWrapper from '../../components/layout/PageWrapper'
import {
  getProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from '../../services/productosService'

const LIMIT = 15

export default function ProductosPage() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)

  const cargarProductos = useCallback(async () => {
    setCargando(true)
    try {
      const data = await getProductos()
      setProductos(data)
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudieron cargar los productos' })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarProductos() }, [cargarProductos])

  useEffect(() => { setPagina(1) }, [busqueda])

  const handleNuevo = () => {
    setProductoEditando(null)
    setModalAbierto(true)
  }

  const handleEditar = (producto) => {
    setProductoEditando(producto)
    setModalAbierto(true)
  }

  const handleGuardar = async (form) => {
    try {
      if (productoEditando) {
        await actualizarProducto(productoEditando.id, form)
        sileo.success({ title: 'Producto actualizado', description: `${form.descripcion} fue actualizado correctamente` })
      } else {
        await crearProducto(form)
        sileo.success({ title: 'Producto creado', description: `${form.descripcion} fue agregado al sistema` })
      }
      setModalAbierto(false)
      cargarProductos()
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudo guardar el producto' })
    }
  }

  const handleToggleDisponible = async (producto) => {
    try {
      if (producto.disponible) {
        await eliminarProducto(producto.id)
        sileo.info({ title: 'Producto desactivado', description: `${producto.descripcion} fue desactivado` })
      } else {
        await actualizarProducto(producto.id, { disponible: true })
        sileo.success({ title: 'Producto activado', description: `${producto.descripcion} está disponible nuevamente` })
      }
      cargarProductos()
    } catch (err) {
      console.error(err)
      sileo.error({ title: 'Error', description: 'No se pudo cambiar el estado del producto' })
    }
  }

  const productosFiltrados = productos.filter((p) =>
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const totalPaginas = Math.ceil(productosFiltrados.length / LIMIT)
  const productosPaginados = productosFiltrados.slice((pagina - 1) * LIMIT, pagina * LIMIT)

  return (
    <PageWrapper>

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Package size={40} color="var(--color-primary)" />
          <div className="ms-2">
            <h4 className="mb-0 fw-semibold" style={{ color: 'var(--color-text)' }}>
              Gestión de productos
            </h4>
            <small style={{ color: 'var(--color-text-secondary)' }}>
              Administrá los productos del menú
            </small>
          </div>
        </div>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>

        <div style={{ background: GRADIENTS.bosque, padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className="fw-semibold small text-white" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              Catálogo
            </span>
            <div className="d-flex gap-2">
              <button
                onClick={cargarProductos}
                disabled={cargando}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '4px 12px',
                  color: 'white',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <RefreshCw size={13} /> Actualizar
              </button>
              <button
                onClick={handleNuevo}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '4px 12px',
                  color: 'white',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Plus size={14} /> Nuevo producto
              </button>
            </div>
          </div>

          <InputGroup size="sm">
            <InputGroup.Text style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white' }}>
              <Search size={14} />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por código o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                fontSize: '0.875rem',
              }}
              className="placeholder-white"
            />
          </InputGroup>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '0 0 1rem' }}>
          {cargando ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: '#4b134f' }} />
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-5" style={{ color: 'var(--color-text-secondary)' }}>
              <Package size={36} className="mb-2 opacity-25" />
              <p className="mb-0">No se encontraron productos.</p>
            </div>
          ) : (
            <>
              <ProductosTable
                productos={productosPaginados}
                onEditar={handleEditar}
                onToggleDisponible={handleToggleDisponible}
              />

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
                      if (idx > 0 && p - arr[idx - 1] > 1) {
                        acc.push('...')
                      }
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} style={{ color: 'var(--color-text-secondary)', padding: '0 4px', fontSize: '0.8rem' }}>
                          ...
                        </span>
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

      <ProductoFormModal
        show={modalAbierto}
        onHide={() => setModalAbierto(false)}
        producto={productoEditando}
        onGuardar={handleGuardar}
      />
    </PageWrapper>
  )
}