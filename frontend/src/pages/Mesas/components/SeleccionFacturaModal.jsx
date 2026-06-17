import { Modal, Table } from 'react-bootstrap'
import { Plus, ChevronRight, Receipt } from 'lucide-react'
import { GRADIENTS } from '../../../constants/theme'

const ESTADO_CONFIG = {
  abierta:  { label: 'Abierta',  color: '#dc2626', bg: '#fef2f2' },
  impresa:  { label: 'Impresa',  color: '#92400e', bg: '#fef3c7' },
  dividida: { label: 'Dividida', color: '#0891b2', bg: '#e0f2fe' },
}

export default function SeleccionFacturaModal({ show, onHide, mesa, facturas, onSeleccionar, onNueva, creando }) {
  return (
    <Modal show={show} onHide={onHide} centered animation={true} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>

        <div style={{ background: GRADIENTS.azul, padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Receipt size={20} color="white" />
              <span className="fw-bold text-white fs-5">
                {mesa?.nombre || `Mesa ${mesa?.id}`}
              </span>
            </div>
            <button
              onClick={onHide}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              ✕
            </button>
          </div>
          <div className="text-white opacity-70 small mt-1">
            Seleccioná una cuenta o creá una nueva
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '0' }}>
          <div className="table-responsive">
            <Table hover className="align-middle mb-0" style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th className="fw-bold ps-4 border-0" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}>
                    #
                  </th>
                  <th className="fw-bold border-0" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}>
                    Detalle
                  </th>
                  <th className="fw-bold border-0" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}>
                    Estado
                  </th>
                  <th className="border-0" style={{ backgroundColor: 'var(--color-surface)' }} />
                </tr>
              </thead>
              <tbody>
                {facturas.map(f => {
                  const cfg = ESTADO_CONFIG[f.estado] || ESTADO_CONFIG.abierta
                  return (
                    <tr
                      key={f.id}
                      style={{ cursor: 'pointer', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                      onClick={() => onSeleccionar(f.id)}
                    >
                      <td className="ps-4" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                        #{f.id}
                      </td>
                      <td className="fw-medium">
                        {f.detalle || <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Sin detalle</span>}
                      </td>
                      <td>
                        <span style={{
                          background: cfg.bg,
                          color: cfg.color,
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                        }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="text-end pe-3">
                        <ChevronRight size={16} color="var(--color-text-secondary)" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>

          <div style={{ padding: '1rem 1.5rem' }}>
            <button
              onClick={onNueva}
              disabled={creando}
              style={{
                width: '100%',
                background: 'transparent',
                border: '2px dashed var(--color-primary)',
                borderRadius: 10,
                padding: '10px',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: creando ? 0.7 : 1,
              }}
            >
              <Plus size={16} />
              {creando ? 'Creando...' : 'Nueva cuenta'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}