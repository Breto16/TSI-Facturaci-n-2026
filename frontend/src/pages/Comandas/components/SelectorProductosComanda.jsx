import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search } from 'lucide-react'
import { getProductos } from '../../../services/productosService'

const construirOpciones = (productos) => {
  const opciones = []
  const vistos = new Set()

  for (const p of productos) {
    if (!p.disponible) continue

    if (p.tiene_variantes && p.variantes?.length > 0) {
      for (const v of p.variantes) {
        opciones.push({
          key: `${p.id}-v${v.id}`,
          producto: p,
          label: p.prefijo_en_variante ? `${p.descripcion} ${v.nombre}` : v.nombre,
          variante: v.nombre,
        })
      }
    } else {
      const claveDedup = p.descripcion.trim().toLowerCase()
      if (vistos.has(claveDedup)) continue
      vistos.add(claveDedup)
      opciones.push({
        key: `${p.id}`,
        producto: p,
        label: p.descripcion,
        variante: null,
      })
    }
  }

  return opciones
}

export default function SelectorProductosComanda({ onSeleccionar, focusTrigger }) {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filaActiva, setFilaActiva] = useState(0)
  const inputRef = useRef(null)
  const tablaRef = useRef(null)

  useEffect(() => {
    getProductos().then(setProductos)
  }, [])

  const opciones = useMemo(() => construirOpciones(productos), [productos])

  useEffect(() => { setFilaActiva(0) }, [busqueda])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [focusTrigger])

  const filtrados = opciones.filter(o =>
    o.label.toLowerCase().includes(busqueda.toLowerCase())
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
        padding: '8px 12px',
        borderRadius: 10,
        border: '1px solid var(--color-border)',
        background: 'var(--color-background)',
      }}>
        <Search size={16} color="var(--color-text-secondary)" />
        <input
          ref={inputRef}
          autoFocus
          type="text"
          placeholder="Buscar producto... (ej: coca cola, trucha, lomo)"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text)',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--color-border)' }}>
        <table ref={tablaRef} style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
          <tbody>
            {filtrados.map((o, i) => (
              <tr
                key={o.key}
                data-fila={i}
                onClick={() => onSeleccionar(o)}
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
                <td style={{ padding: '10px 14px' }}>{o.label}</td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
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