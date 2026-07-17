import { useState, useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'

export default function TablaItems({
    items,
    onActualizar,
    onEliminar,
    editable,
    seleccionable = false,
    itemSeleccionado,
    onSeleccionar,
    itemVerificado,
    onVerificar,
}) {
    const { theme } = useTheme()
    const [editandoId, setEditandoId] = useState(null)
    const [valorEdit, setValorEdit] = useState('')
    const [validados, setValidados] = useState(new Set())
    const inputRef = useRef(null)
    const tablaRef = useRef(null)

    const iniciarEdicion = (item) => {
        if (!editable || seleccionable || validados.has(item.id)) return
        setEditandoId(item.id)
        setValorEdit(String(item.cantidad))
        setTimeout(() => inputRef.current?.select(), 30)
    }

    const confirmarEdicion = (item) => {
        const n = parseInt(valorEdit)
        if (!isNaN(n) && n !== item.cantidad) onActualizar(item.id, n)
        setEditandoId(null)
    }

    const toggleValidado = (id) => {
        setValidados(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    // Navegacion con flechas en modo verificacion
    useEffect(() => {
        if (!onVerificar || seleccionable) return

        const handleKeyDown = (e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
            e.preventDefault()

            const idx = itemVerificado
                ? items.findIndex(i => i.id === itemVerificado.id)
                : -1

            let siguiente
            if (e.key === 'ArrowDown') {
                siguiente = items[idx + 1] || items[0]
            } else {
                siguiente = items[idx - 1] || items[items.length - 1]
            }

            if (siguiente) {
                onVerificar(siguiente)
                // scroll al item
                const fila = tablaRef.current?.querySelector(`[data-id="${siguiente.id}"]`)
                fila?.scrollIntoView({ block: 'nearest' })
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [items, itemVerificado, onVerificar, seleccionable])

    if (items.length === 0) {
        return (
            <div className="text-center py-4" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                Sin items agregados
            </div>
        )
    }

    return (
        <div ref={tablaRef} style={{ overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1 }}>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        {onVerificar && !seleccionable && <th style={{ width: 34 }} />}
                        <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'center', width: 60 }}>Cant.</th>
                        <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Descripcion</th>
                        <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>P.Unit</th>
                        <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Total</th>
                        {editable && !seleccionable && <th style={{ width: 36 }} />}
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => {
                        const esteSeleccionado = itemSeleccionado?.id === item.id
                        const esteVerificado = itemVerificado?.id === item.id
                        const esValidado = validados.has(item.id)
                        const modoVerificacion = !!onVerificar && !seleccionable

                        const handleClick = () => {
                            if (seleccionable) {
                                onSeleccionar?.(esteSeleccionado ? null : item)
                            } else if (onVerificar) {
                                onVerificar(esteVerificado ? null : item)
                            }
                        }

                        return (
                            <tr
                                key={item.id}
                                data-id={item.id}
                                onClick={handleClick}
                                style={{
                                    borderBottom: '1px solid var(--color-border)',
                                    color: 'var(--color-text)',
                                    backgroundColor: 'var(--color-surface)',
                                    filter: esValidado
                                        ? (theme === 'dark' ? 'brightness(1.18)' : 'brightness(0.9)')
                                        : 'none',
                                    outline: esteSeleccionado
                                        ? '2px solid var(--color-primary)'
                                        : (!esValidado && esteVerificado)
                                            ? '2px solid var(--color-primary)'
                                            : 'none',
                                    outlineOffset: '-2px',
                                    cursor: (seleccionable || onVerificar) ? 'pointer' : 'default',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {modoVerificacion && (
                                    <td style={{ padding: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            {(esteVerificado || esValidado) && (
                                                <input
                                                    type="checkbox"
                                                    checked={esValidado}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={() => toggleValidado(item.id)}
                                                    style={{ width: 18, height: 18, margin: 0, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                                                />
                                            )}
                                        </div>
                                    </td>
                                )}
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
                                            onClick={e => {
                                                e.stopPropagation()
                                                if (!seleccionable) iniciarEdicion(item)
                                            }}
                                            style={{
                                                cursor: editable && !seleccionable && !esValidado ? 'pointer' : 'default',
                                                padding: '2px 6px',
                                                borderRadius: 6,
                                                background: editable && !seleccionable && !esValidado ? 'var(--color-background)' : 'transparent',
                                                border: editable && !seleccionable && !esValidado ? '1px solid var(--color-border)' : 'none',
                                                display: 'inline-block',
                                                minWidth: 32,
                                                fontWeight: esValidado ? 700 : 400,
                                                color: esteSeleccionado
                                                    ? 'var(--color-primary)'
                                                    : esValidado
                                                        ? 'var(--color-success)'
                                                        : 'var(--color-text)',
                                            }}
                                        >
                                            {item.cantidad}
                                        </span>
                                    )}
                                </td>
                                <td style={{
                                    padding: '5px 8px',
                                    fontWeight: esValidado ? 700 : 400,
                                    color: esteSeleccionado
                                        ? 'var(--color-primary)'
                                        : esValidado
                                            ? 'var(--color-success)'
                                            : 'var(--color-text)',
                                }}>
                                    {item.descripcion}
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                                    ₡{Number(item.precio_unitario).toLocaleString('es-CR')}
                                </td>
                                <td style={{
                                    padding: '5px 8px',
                                    textAlign: 'right',
                                    fontWeight: 600,
                                    color: esteSeleccionado ? 'var(--color-primary)' : 'var(--color-text)',
                                }}>
                                    ₡{Number(item.total).toLocaleString('es-CR')}
                                </td>
                                {editable && !seleccionable && (
                                    <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation()
                                                onEliminar(item.id)
                                            }}
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