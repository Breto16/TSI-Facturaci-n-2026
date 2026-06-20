import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { getProductosParaConsultas } from '../../../services/productosService'

export default function SelectorProductosPills({ seleccionados, onChange }) {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [mostrarLista, setMostrarLista] = useState(false)
  const contenedorRef = useRef(null)

  useEffect(() => {
    getProductosParaConsultas().then(setProductos)
  }, [])

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setMostrarLista(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  const filtrados = productos.filter(p =>
    !seleccionados.find(s => s.codigo === p.codigo) &&
    (p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
     (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase()))
  )

  const agregar = (producto) => {
    onChange([...seleccionados, producto])
    setBusqueda('')
  }

  const quitar = (codigo) => {
    onChange(seleccionados.filter(p => p.codigo !== codigo))
  }

  return (
    <div ref={contenedorRef} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 10,
        border: '1px solid var(--color-border)',
        background: 'var(--color-background)',
      }}>
        <Search size={14} color="var(--color-text-secondary)" />
        <input
          type="text"
          placeholder="Buscar producto para agregar..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onFocus={() => setMostrarLista(true)}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
      </div>

      {mostrarLista && busqueda && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          maxHeight: 220,
          overflowY: 'auto',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          zIndex: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>
          {filtrados.length === 0 ? (
            <div style={{ padding: '10px', color: 'var(--color-text-secondary)', fontSize: '0.82rem', textAlign: 'center' }}>
              Sin resultados
            </div>
          ) : filtrados.slice(0, 30).map(p => (
            <div
              key={p.codigo}
              onClick={() => agregar(p)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                color: 'var(--color-text)',
                borderBottom: '1px solid var(--color-border)',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {p.descripcion}
            </div>
          ))}
        </div>
      )}

      {seleccionados.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-2">
          {seleccionados.map(p => (
            <span
              key={p.codigo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: '0.78rem',
              }}
            >
              {p.descripcion}
              <button
                onClick={() => quitar(p.codigo)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}