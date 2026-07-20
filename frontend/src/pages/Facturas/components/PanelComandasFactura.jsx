import { useState } from 'react'
import { CheckCircle2, Circle, Trash2, Printer, X } from 'lucide-react'
import { eliminarItemComanda, vaciarComanda, reimprimirComanda } from '../../../services/comandasService'
import { sileo } from 'sileo'

const ACOMPANAMIENTO_LABEL = {
  yuca: 'Yuca', papa: 'Papa', patacon: 'Patacón', especial: 'Especial', solo: 'Solo(a)',
}

export default function PanelComandasFactura({ comandas, cargando, revisados, onToggleRevisado, onRecargar }) {
  const [procesando, setProcesando] = useState(null)

  if (cargando) {
    return (
      <div className="text-center py-4" style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
        Cargando comandas...
      </div>
    )
  }

  if (comandas.length === 0) {
    return (
      <div className="text-center py-4" style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
        Sin comandas registradas
      </div>
    )
  }

  const handleEliminarItem = async (itemId) => {
    setProcesando(itemId)
    try {
      await eliminarItemComanda(itemId)
      onRecargar()
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo eliminar el item' })
    } finally {
      setProcesando(null)
    }
  }

  const handleVaciarComanda = async (comandaId) => {
    if (!window.confirm('¿Eliminar todos los items de esta comanda? No afecta la factura.')) return
    setProcesando(`comanda-${comandaId}`)
    try {
      await vaciarComanda(comandaId)
      onRecargar()
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo vaciar la comanda' })
    } finally {
      setProcesando(null)
    }
  }

  const handleReimprimir = async (comandaId, tipo) => {
    setProcesando(`print-${comandaId}-${tipo}`)
    try {
      await reimprimirComanda(comandaId, tipo)
      sileo.success({ title: 'Enviado', description: `Ticket de ${tipo === 'cocina' ? 'cocina' : 'salón'} reimpreso` })
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo reimprimir' })
    } finally {
      setProcesando(null)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {comandas.map(c => (
        <div key={c.id} style={{ borderRadius: 10, border: '1px solid var(--color-border)', padding: '10px 12px' }}>
          <div className="d-flex justify-content-between mb-1">
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Mesa {(c.mesa_nombre || c.mesa_id)?.toString().replace(/mesa/i, '').trim()}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
              {new Date(c.creado_en).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {c.salonero_nombre && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              {c.salonero_nombre}
            </div>
          )}
          {c.ficha && (
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
              {c.ficha}
            </div>
          )}

          {c.items.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              Comanda vaciada
            </div>
          ) : (
            <div className="d-flex flex-column gap-1 mb-2">
              {c.items.map(item => {
                const revisado = revisados.has(item.id)
                let linea = `${item.cantidad}× ${item.descripcion}`
                if (item.variante) linea += ` (${item.variante})`
                if (item.acompanamiento) linea += ` c/${ACOMPANAMIENTO_LABEL[item.acompanamiento] || item.acompanamiento}`
                return (
                  <div key={item.id} className="d-flex align-items-center justify-content-between" style={{ gap: 6 }}>
                    <div
                      onClick={() => onToggleRevisado(item.id)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 6, cursor: 'pointer', padding: '3px 4px', borderRadius: 6, flex: 1, minWidth: 0 }}
                    >
                      {revisado
                        ? <CheckCircle2 size={14} color="var(--color-success)" style={{ marginTop: 2, flexShrink: 0 }} />
                        : <Circle size={14} color="var(--color-text-secondary)" style={{ marginTop: 2, flexShrink: 0 }} />}
                      <span style={{
                        fontSize: '0.8rem',
                        color: revisado ? 'var(--color-text-secondary)' : 'var(--color-text)',
                        textDecoration: revisado ? 'line-through' : 'none',
                      }}>
                        {linea}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEliminarItem(item.id)}
                      disabled={procesando === item.id}
                      title="Eliminar item de la comanda"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', flexShrink: 0, opacity: procesando === item.id ? 0.5 : 1 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="d-flex gap-2 flex-wrap">
            <button
              onClick={() => handleReimprimir(c.id, 'cocina')}
              disabled={procesando === `print-${c.id}-cocina`}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
            >
              <Printer size={12} /> Cocina
            </button>
            <button
              onClick={() => handleReimprimir(c.id, 'salon')}
              disabled={procesando === `print-${c.id}-salon`}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
            >
              <Printer size={12} /> Salón
            </button>
            {c.items.length > 0 && (
              <button
                onClick={() => handleVaciarComanda(c.id)}
                disabled={procesando === `comanda-${c.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid var(--color-danger)', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', color: 'var(--color-danger)', cursor: 'pointer', marginLeft: 'auto' }}
              >
                <Trash2 size={12} /> Eliminar todo
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}