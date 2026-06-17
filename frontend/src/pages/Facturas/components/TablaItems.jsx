import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'

export default function TablaItems({ items, onActualizar, onEliminar, editable, seleccionable = false, itemSeleccionado, onSeleccionar }) {
  const [editandoId, setEditandoId] = useState(null)
  const [valorEdit, setValorEdit] = useState('')
  const inputRef = useRef(null)

  const iniciarEdicion = (item) => {
    if (!editable || seleccionable) return
    setEditandoId(item.id)
    setValorEdit(String(item.cantidad))
    setTimeout(() => inputRef.current?.select(), 30)
  }

  const confirmarEdicion = (item) => {
    const n = parseInt(valorEdit)
    if (!isNaN(n) && n !== item.cantidad) onActualizar(item.id, n)
    setEditandoId(null)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-4" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        Sin items agregados
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1 }}>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'center', width: 60 }}>Cant.</th>
            <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Descripción</th>
            <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>P.Unit</th>
            <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Total</th>
            {editable && !seleccionable && <th style={{ width: 36 }} />}
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const esteSeleccionado = itemSeleccionado?.id === item.id
            return (
              <tr
                key={item.id}
                onClick={() => seleccionable && onSeleccionar?.(esteSeleccionado ? null : item)}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  backgroundColor: esteSeleccionado ? 'transparent' : 'var(--color-surface)',
                  outline: esteSeleccionado ? '2px solid var(--color-primary)' : 'none',
                  outlineOffset: '-2px',
                  cursor: seleccionable ? 'pointer' : 'default',
                  transition: 'all 0.1s ease',
                }}
              >
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                  {editandoId === item.id ? (
                    <input
                      ref={inputRef}
                      type="number"
                      min="0"
                      value={valorEdit}
                      onChange={e => setValorEdit(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmarEdicion(item)
                        if (e.key === 'Escape') setEditandoId(null)
                      }}
                      onBlur={() => confirmarEdicion(item)}
                      style={{ width: 48, textAlign: 'center', padding: '2px 4px', borderRadius: 6, border: '1px solid var(--color-primary)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.82rem' }}
                    />
                  ) : (
                    <span
                      onClick={() => !seleccionable && iniciarEdicion(item)}
                      style={{
                        cursor: editable && !seleccionable ? 'pointer' : 'default',
                        padding: '2px 6px',
                        borderRadius: 6,
                        background: editable && !seleccionable ? 'var(--color-background)' : 'transparent',
                        border: editable && !seleccionable ? '1px solid var(--color-border)' : 'none',
                        display: 'inline-block',
                        minWidth: 32,
                        color: esteSeleccionado ? 'var(--color-primary)' : 'var(--color-text)',
                      }}
                    >
                      {item.cantidad}
                    </span>
                  )}
                </td>
                <td style={{ padding: '5px 8px', color: esteSeleccionado ? 'var(--color-primary)' : 'var(--color-text)' }}>
                  {item.descripcion}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                  ₡{Number(item.precio_unitario).toLocaleString('es-CR')}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: esteSeleccionado ? 'var(--color-primary)' : 'var(--color-text)' }}>
                  ₡{Number(item.total).toLocaleString('es-CR')}
                </td>
                {editable && !seleccionable && (
                  <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                    <button
                      onClick={() => onEliminar(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 2, display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}