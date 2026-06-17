import { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { getProductos } from '../../../services/productosService'

export default function SelectorProductos({ onSeleccionar, focusTrigger }) {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filaActiva, setFilaActiva] = useState(0)
  const inputRef = useRef(null)
  const tablaRef = useRef(null)

  useEffect(() => {
    getProductos().then(data => setProductos(data.filter(p => p.disponible)))
  }, [])

  useEffect(() => { setFilaActiva(0) }, [busqueda])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [focusTrigger])

  const filtrados = productos.filter(p =>
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    String(p.precio).includes(busqueda)
  )

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFilaActiva(f => Math.min(f + 1, filtrados.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFilaActiva(f => Math.max(f - 1, 0))
    } else if (e.key === 'Enter' && filtrados[filaActiva]) {
      onSeleccionar(filtrados[filaActiva])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      setFilaActiva(f => (f + 1) % filtrados.length)
    }
  }, [filtrados, filaActiva, onSeleccionar])

  useEffect(() => {
    const filas = tablaRef.current?.querySelectorAll('tr[data-fila]')
    filas?.[filaActiva]?.scrollIntoView({ block: 'nearest' })
  }, [filaActiva])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
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
          ref={inputRef}
          autoFocus
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={handleKeyDown}
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

      <div style={{ flex: 1, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--color-border)' }}>
        <table ref={tablaRef} style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1 }}>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'left' }}>Descripción</th>
              <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Precio</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p, i) => (
              <tr
                key={p.id}
                data-fila={i}
                onClick={() => onSeleccionar(p)}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-surface)',
                  color: i === filaActiva ? 'var(--color-primary)' : 'var(--color-text)',
                  outline: i === filaActiva ? '2px solid var(--color-primary)' : 'none',
                  outlineOffset: '-2px',
                  transition: 'all 0.1s ease',
                }}
              >
                <td style={{ padding: '6px 10px' }}>{p.descripcion}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>
                  ₡{Number(p.precio).toLocaleString('es-CR')}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={2} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}