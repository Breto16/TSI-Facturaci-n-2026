import { useState, useRef } from 'react'
import { CheckCircle2, Circle, Trash2, Printer, X, Ban, Plus, AlertTriangle } from 'lucide-react'
import { Modal } from 'react-bootstrap'
import { eliminarItemComanda, vaciarComanda, reimprimirComanda, cancelarItemComanda, agregarItemsComanda, ajustarCantidadItemComanda  } from '../../../services/comandasService'
import SelectorProductosComanda from '../../Comandas/components/SelectorProductosComanda'
import ModalDetalleItem from '../../Comandas/components/ModalDetalleItem'
import ModalFichaComanda from '../../Comandas/components/ModalFichaComanda'
import ModalConfirmarAccion from '../../../components/common/ModalConfirmarAccion'
import { ACOMPANAMIENTO_LABEL } from '../../../constants/acompanamientos'
import { sileo } from 'sileo'

export default function PanelComandasFactura({ comandas, cargando, revisados, onToggleRevisado, onRecargar }) {
  const [procesando, setProcesando] = useState(null)
  const [comandaAgregando, setComandaAgregando] = useState(null)
  const [modalSelector, setModalSelector] = useState(false)
  const [productoActivo, setProductoActivo] = useState(null)
  const [varianteActiva, setVarianteActiva] = useState(null)
  const [itemPendienteAgregar, setItemPendienteAgregar] = useState(null)
  const [modalFicha, setModalFicha] = useState(false)
  const [modalCancelar, setModalCancelar] = useState(null) // item o null
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState(null)
  const timeoutEliminarRef = useRef(null)

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

  const hayAviso = comandas.some(c => c.items.some(i => i.cancelado) || c.items_eliminados)

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

  const handleClickEliminar = (itemId) => {
    if (confirmandoEliminarId === itemId) {
      clearTimeout(timeoutEliminarRef.current)
      setConfirmandoEliminarId(null)
      handleEliminarItem(itemId)
    } else {
      setConfirmandoEliminarId(itemId)
      clearTimeout(timeoutEliminarRef.current)
      timeoutEliminarRef.current = setTimeout(() => setConfirmandoEliminarId(null), 2500)
    }
  }

  const handleCancelarItem = async (itemId) => {
    setModalCancelar(null)
    setProcesando(itemId)
    try {
      await cancelarItemComanda(itemId)
      onRecargar()
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo cancelar el item' })
    } finally {
      setProcesando(null)
    }
  }

  const handleVaciarComanda = async (comandaId) => {
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

  const handleSeleccionarOpcion = (opcion) => {
    setModalSelector(false)
    setProductoActivo(opcion.producto)
    setVarianteActiva(opcion.variante)
  }

  const confirmarAgregarItem = async (item, ficha) => {
    const comandaId = comandaAgregando
    setModalFicha(false)
    setItemPendienteAgregar(null)
    setComandaAgregando(null)
    if (!comandaId) return
    try {
      await agregarItemsComanda(comandaId, [item], ficha)
      sileo.success({ title: 'Item agregado', description: 'Se agregó a la comanda y se reimprimió cocina' })
      onRecargar()
    } catch (err) {
      sileo.error({ title: 'Error', description: err.response?.data?.msg || 'No se pudo agregar el item' })
    }
  }

  const handleConfirmarItem = (item) => {
    const comandaObjetivo = comandas.find(c => c.id === comandaAgregando)
    const necesitaFicha = !!productoActivo?.requiere_ficha && !comandaObjetivo?.ficha

    setItemPendienteAgregar(item)
    setProductoActivo(null)
    setVarianteActiva(null)

    if (necesitaFicha) {
      setModalFicha(true)
    } else {
      confirmarAgregarItem(item, null)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {hayAviso && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--color-danger)', color: 'white', fontSize: '0.78rem', fontWeight: 600 }}>
          Importante: hay items cancelados o eliminados en las comandas. Verificá que la factura no los siga cobrando.
        </div>
      )}

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
                let linea = `${item.cantidad}× ${item.descripcion}`
                if (item.variante) linea += ` (${item.variante})`
                if (item.acompanamiento) linea += ` c/${ACOMPANAMIENTO_LABEL[item.acompanamiento] || item.acompanamiento}`

                if (item.cancelado) {
                  return (
                    <div key={item.id} className="d-flex align-items-center gap-2" style={{ padding: '3px 4px', opacity: 0.7 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-danger)', flexShrink: 0 }}>CANCELADO</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}>
                        {linea}
                      </span>
                    </div>
                  )
                }

                const revisado = revisados.has(item.id)
                const eliminandoArmado = confirmandoEliminarId === item.id

                return (
                  <div key={item.id} className="d-flex align-items-center justify-content-between" style={{ gap: 4 }}>
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

                    {!item.despachado && (
                      <div className="d-flex align-items-center" style={{ flexShrink: 0 }}>
                        <button
                          onClick={() => ajustarCantidadItemComanda(item.id, -1).then(onRecargar).catch(() => sileo.error({ title: 'Error', description: 'No se pudo ajustar la cantidad' }))}
                          title="Restar uno"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2 }}
                        >
                          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>−</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setModalCancelar(item)}
                      disabled={procesando === item.id}
                      title="Cancelar (el cliente ya no lo quiere)"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-warning)', flexShrink: 0, opacity: procesando === item.id ? 0.5 : 1 }}
                    >
                      <Ban size={14} />
                    </button>
                    <button
                      onClick={() => handleClickEliminar(item.id)}
                      disabled={procesando === item.id}
                      title={eliminandoArmado ? 'Click de nuevo para confirmar' : 'Eliminar (fue un error, sin rastro)'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: eliminandoArmado ? 'var(--color-danger)' : 'var(--color-text-secondary)', flexShrink: 0, opacity: procesando === item.id ? 0.5 : 1 }}
                    >
                      {eliminandoArmado ? <AlertTriangle size={14} /> : <X size={14} />}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="d-flex gap-2 flex-wrap">
            <button
              onClick={() => { setComandaAgregando(c.id); setModalSelector(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid var(--color-primary)', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', color: 'var(--color-primary)', cursor: 'pointer' }}
            >
              <Plus size={12} /> Agregar
            </button>
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
                onClick={() => setModalCancelar({ id: null, esComanda: true, comandaId: c.id })}
                disabled={procesando === `comanda-${c.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid var(--color-danger)', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', color: 'var(--color-danger)', cursor: 'pointer', marginLeft: 'auto' }}
              >
                <Trash2 size={12} /> Eliminar todo
              </button>
            )}
          </div>
        </div>
      ))}

      <Modal show={modalSelector} onHide={() => { setModalSelector(false); setComandaAgregando(null) }} centered size="lg" animation={false} contentClassName="border-0 bg-transparent">
        <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--color-surface)', padding: '1.5rem', height: '75vh' }}>
          <SelectorProductosComanda onSeleccionar={handleSeleccionarOpcion} focusTrigger={modalSelector} />
        </div>
      </Modal>

      <ModalDetalleItem
        show={!!productoActivo}
        producto={productoActivo}
        varianteInicial={varianteActiva}
        onHide={() => { setProductoActivo(null); setVarianteActiva(null); setComandaAgregando(null) }}
        onConfirmar={handleConfirmarItem}
      />

      <ModalFichaComanda
        show={modalFicha}
        onHide={() => { setModalFicha(false); setItemPendienteAgregar(null); setComandaAgregando(null) }}
        onConfirmar={(ficha) => confirmarAgregarItem(itemPendienteAgregar, ficha)}
      />

      <ModalConfirmarAccion
        show={!!modalCancelar}
        onHide={() => setModalCancelar(null)}
        titulo={modalCancelar?.esComanda ? 'Vaciar comanda' : 'Cancelar item'}
        mensaje={
          modalCancelar?.esComanda
            ? '¿Eliminar todos los items de esta comanda? No afecta la factura.'
            : `¿Cancelar "${modalCancelar ? `${modalCancelar.cantidad}× ${modalCancelar.descripcion}` : ''}"? Cocina dejará de prepararlo. Recordá ajustar la factura manualmente si ya se había facturado.`
        }
        textoConfirmar={modalCancelar?.esComanda ? 'Vaciar' : 'Cancelar item'}
        colorAccion={modalCancelar?.esComanda ? 'var(--color-danger)' : 'var(--color-warning)'}
        onConfirmar={() => {
          if (modalCancelar?.esComanda) {
            setModalCancelar(null)
            handleVaciarComanda(modalCancelar.comandaId)
          } else {
            handleCancelarItem(modalCancelar.id)
          }
        }}
      />
    </div>
  )
}