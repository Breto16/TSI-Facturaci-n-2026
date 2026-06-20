import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { Lock } from 'lucide-react'
import { sileo } from 'sileo'
import { GRADIENTS } from '../../../constants/theme'
import { guardarCierre } from '../../../services/consultasService'
import { imprimirCierre } from '../../../services/impresionService'

export default function ModalRealizarCierre({
  show, onHide, fecha, totales, servicios, consultasIncluidas
}) {
  const [tarjeta, setTarjeta] = useState('')
  const [efectivoContado, setEfectivoContado] = useState('')
  const [guardando, setGuardando] = useState(false)

  const totalSistema = Number(totales?.total_general || 0)
  const totalTrucha = Number(totales?.total_trucha || 0)
  const efectivoSistema = totalSistema - (parseFloat(tarjeta) || 0)
  const diferencia = (parseFloat(efectivoContado) || 0) +
    (parseFloat(tarjeta) || 0) - totalSistema

  const handleConfirmar = async () => {
    setGuardando(true)
    try {
      await guardarCierre({
        fecha,
        totalSistema,
        totalEfectivoContado: parseFloat(efectivoContado) || 0,
        totalTarjetaDatafono: parseFloat(tarjeta) || 0,
      })

      await imprimirCierre({
        totalSistema,
        totalTarjetaDatafono: parseFloat(tarjeta) || 0,
        totalEfectivoSistema: efectivoSistema,
        totalEfectivoContado: parseFloat(efectivoContado) || 0,
        diferencia,
        servicios,
        consultasIncluidas,
      })

      sileo.success({ title: 'Cierre realizado', description: 'El cierre fue registrado e impreso' })
      onHide()
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo completar el cierre' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered animation={false} contentClassName="border-0 bg-transparent">
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Lock size={20} color="var(--color-text-bg)" />
              <span className="fw-bold fs-5" style={{ color: 'var(--color-text-bg)' }}>Realizar cierre</span>
            </div>
            <button onClick={onHide} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--color-text-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Total del sistema</span>
            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>₡{totalSistema.toLocaleString('es-CR')}</span>
          </div>

          <label className="small fw-medium mb-1 d-block" style={{ color: 'var(--color-text)' }}>
            Monto cobrado por tarjeta (datafono)
          </label>
          <input
            type="number"
            value={tarjeta}
            onChange={e => setTarjeta(e.target.value)}
            placeholder="0"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '1rem', marginBottom: 12 }}
          />

          {tarjeta && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 12, color: 'var(--color-text-secondary)' }}>
              <span>Efectivo esperado (calculado)</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>₡{efectivoSistema.toLocaleString('es-CR')}</span>
            </div>
          )}

          <label className="small fw-medium mb-1 d-block" style={{ color: 'var(--color-text)' }}>
            Efectivo contado manualmente
          </label>
          <input
            type="number"
            value={efectivoContado}
            onChange={e => setEfectivoContado(e.target.value)}
            placeholder="0"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '1rem', marginBottom: 12 }}
          />

          {(tarjeta || efectivoContado) && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 12px', borderRadius: 8,
              background: Math.abs(diferencia) < 1 ? '#cbdbd0' : '#fef2f2',
              marginBottom: 16,
            }}>
              <span style={{ fontWeight: 600, color: Math.abs(diferencia) < 1 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                Diferencia
              </span>
              <span style={{ fontWeight: 700, color: Math.abs(diferencia) < 1 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                ₡{diferencia.toLocaleString('es-CR')}
              </span>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <button onClick={onHide} style={{ background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '7px 16px', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-btn-secondary-text)' }}>
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={guardando}
              style={{ background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '7px 16px', color: 'var(--color-text-bg)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: guardando ? 0.7 : 1 }}
            >
              {guardando ? 'Procesando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}