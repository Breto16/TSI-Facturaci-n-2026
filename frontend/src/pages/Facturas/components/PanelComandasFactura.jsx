import { CheckCircle2, Circle } from 'lucide-react'

const ACOMPANAMIENTO_LABEL = {
  yuca: 'Yuca', papa: 'Papa', patacon: 'Patacón', especial: 'Especial', solo: 'Solo(a)',
}

export default function PanelComandasFactura({ comandas, cargando, revisados, onToggleRevisado }) {
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
          <div className="d-flex flex-column gap-1">
            {c.items.map(item => {
              const revisado = revisados.has(item.id)
              let linea = `${item.cantidad}× ${item.descripcion}`
              if (item.variante) linea += ` (${item.variante})`
              if (item.acompanamiento) linea += ` c/${ACOMPANAMIENTO_LABEL[item.acompanamiento] || item.acompanamiento}`
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleRevisado(item.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 6, cursor: 'pointer',
                    padding: '3px 4px', borderRadius: 6,
                  }}
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
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}