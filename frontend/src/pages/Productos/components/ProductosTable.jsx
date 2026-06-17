import { Table } from 'react-bootstrap'
import { Pencil, Eye, EyeOff } from 'lucide-react'

const CATEGORIA_CONFIG = {
  salon:  { label: 'Salón',  color: '#0891b2', bg: '#e0f2fe' },
  cocina: { label: 'Cocina', color: '#92400e', bg: '#fef3c7' },
}

const DISPONIBLE_CONFIG = {
  true:  { label: 'Disponible', color: '#1c530d', bg: '#dcfce7' },
  false: { label: 'Inactivo',   color: '#4a5568', bg: '#f3f4f6' },
}

const BadgeSpan = ({ color, bg, label }) => (
  <span style={{
    background: bg,
    color,
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: '0.65rem',
    fontWeight: 600,
  }}>
    {label}
  </span>
)

export default function ProductosTable({ productos, onEditar, onToggleDisponible }) {
  return (
    <div className="table-responsive">
      <Table hover className="align-middle mb-0" style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
        <thead>
  <tr style={{
    backgroundColor: 'var(--color-surface)',
    borderBottom: '2px solid var(--color-border)',
  }}>
    <th className="fw-bold border-0 ps-4" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}>Código</th>
    <th className="fw-bold border-0" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}>Descripción</th>
    <th className="fw-bold border-0" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}>Precio</th>
    <th className="fw-bold border-0" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}>Prioridad</th>
    <th className="fw-bold border-0" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}>Categoría</th>
    <th className="fw-bold border-0" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}>Estado</th>
    <th className="border-0" style={{ backgroundColor: 'var(--color-surface)' }} />
  </tr>
</thead>
        <tbody>
          {productos.map((p) => {
            const cat = CATEGORIA_CONFIG[p.categoria] || CATEGORIA_CONFIG.salon
            const disp = DISPONIBLE_CONFIG[String(p.disponible)]
            return (
              <tr
  key={p.id}
  style={{
    opacity: p.disponible ? 1 : 0.55,
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
  }}
>
                <td className="ps-4" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                  {p.codigo || '—'}
                </td>
                <td className="fw-medium">{p.descripcion}</td>
                <td>₡{Number(p.precio).toLocaleString('es-CR')}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{p.prioridad}</td>
                <td><BadgeSpan {...cat} /></td>
                <td><BadgeSpan {...disp} /></td>
                <td className="text-end pe-3">
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      onClick={() => onEditar(p)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--color-border)',
                        borderRadius: 7,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onToggleDisponible(p)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--color-border)',
                        borderRadius: 7,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        color: p.disponible ? 'var(--color-text-secondary)' : '#1c530d',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {p.disponible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}