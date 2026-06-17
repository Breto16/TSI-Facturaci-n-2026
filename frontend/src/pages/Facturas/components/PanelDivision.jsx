import { useState, useCallback } from 'react'
import { Modal } from 'react-bootstrap'
import { Plus } from 'lucide-react'
import { sileo } from 'sileo'
import { GRADIENTS } from '../../../constants/theme'
import { crearHija, actualizarEstado, actualizarTotales, getItems, getFactura } from '../../../services/facturasService'
import { actualizarDetalle } from '../../../services/facturasService'

const BTN_BASE = {
    background: 'transparent',
    borderRadius: 8,
    padding: '5px 10px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
}

const ESTADO_CONFIG = {
    abierta: { label: 'Abierta', color: 'var(--color-danger)' },
    impresa: { label: 'Impresa', color: 'var(--color-warning)' },
    pagada: { label: 'Pagada', color: 'var(--color-success)' },
    anulada: { label: 'Anulada', color: 'var(--color-text-secondary)' },
}

const ModalConfirmacionHija = ({ show, onHide, titulo, descripcion, onConfirmar, colorBtn, textoBtn, procesando }) => (
    <Modal show={show} onHide={onHide} centered animation={false} contentClassName="border-0 bg-transparent">
        <div style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ background: GRADIENTS.azul, padding: '1.25rem 1.5rem' }}>
                <div className="d-flex align-items-center justify-content-between">
                    <span className="fw-bold text-white fs-5">{titulo}</span>
                    <button onClick={onHide} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
                <p style={{ color: 'var(--color-text)', marginBottom: '1.5rem' }}>{descripcion}</p>
                <div className="d-flex justify-content-end gap-2">
                    <button onClick={onHide} style={{ ...BTN_BASE, border: '1px solid var(--color-btn-secondary-border)', color: 'var(--color-btn-secondary-text)', padding: '7px 16px' }}>
                        Cancelar
                    </button>
                    <button onClick={onConfirmar} disabled={procesando} style={{ ...BTN_BASE, border: `1px solid ${colorBtn}`, color: colorBtn, opacity: procesando ? 0.6 : 1, padding: '7px 16px' }}>
                        {procesando ? 'Procesando...' : textoBtn}
                    </button>
                </div>
            </div>
        </div>
    </Modal>
)

export default function PanelDivision({
    facturapadreId,
    hijas,
    hijaSeleccionada,
    itemsHija,
    itemHijaSeleccionado,
    onItemHijaSeleccionado,
    onHijaSeleccionada,
    onRefrescar,
}) {
    const [creando, setCreando] = useState(false)
    const [editandoDetalle, setEditandoDetalle] = useState(null)
    const [valorDetalle, setValorDetalle] = useState('')
    const [procesando, setProcesando] = useState(false)
    const [modalAnular, setModalAnular] = useState(false)
    const [modalPago, setModalPago] = useState(false)
    const [tipoPago, setTipoPago] = useState('efectivo')
    const [montoRecibido, setMontoRecibido] = useState('')

    const handleCrearHija = async () => {
        setCreando(true)
        try {
            const hija = await crearHija(facturapadreId)
            sileo.success({ title: 'Cuenta creada', description: `Factura hija #${hija.id} creada` })
            onRefrescar(hija.id)
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo crear la factura hija' })
        } finally {
            setCreando(false)
        }
    }

    const handleGuardarDetalle = async (hijaId) => {
        try {
            await actualizarDetalle(hijaId, valorDetalle)
            setEditandoDetalle(null)
            onRefrescar(hijaSeleccionada?.id)
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo guardar el detalle' })
        }
    }

    const iniciarEdicionDetalle = (e, hija) => {
        e.stopPropagation()
        setEditandoDetalle(hija.id)
        setValorDetalle(hija.detalle || '')
    }

    const handleAnularHija = async () => {
        if (!hijaSeleccionada) return
        setProcesando(true)
        try {
            await actualizarEstado(hijaSeleccionada.id, { estado: 'anulada' })
            sileo.info({ title: 'Anulada', description: `Hija #${hijaSeleccionada.id} fue anulada` })
            setModalAnular(false)
            onRefrescar(hijaSeleccionada.id)
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo anular' })
        } finally {
            setProcesando(false)
        }
    }

    const handleImprimirHija = async () => {
        if (!hijaSeleccionada) return
        try {
            await actualizarEstado(hijaSeleccionada.id, { estado: 'impresa' })
            sileo.success({ title: 'Imprimiendo', description: `Hija #${hijaSeleccionada.id} enviada a impresora` })
            onRefrescar(hijaSeleccionada.id)
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo imprimir' })
        }
    }

    const handlePagarHija = async () => {
        if (!hijaSeleccionada) return
        const hijaTotal = Number(hijaSeleccionada.total)
        const cambio = tipoPago === 'efectivo' && montoRecibido
            ? parseFloat(montoRecibido) - hijaTotal
            : null
        setProcesando(true)
        try {
            await actualizarEstado(hijaSeleccionada.id, {
                estado: 'pagada',
                tipo_pago: tipoPago,
                monto_recibido: tipoPago === 'efectivo' ? parseFloat(montoRecibido) : null,
                cambio,
            })
            sileo.success({ title: 'Cobrada', description: `Hija #${hijaSeleccionada.id} cobrada` })
            setModalPago(false)
            setMontoRecibido('')
            onRefrescar(hijaSeleccionada.id)
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo cobrar' })
        } finally {
            setProcesando(false)
        }
    }

    const esEditable = hijaSeleccionada &&
        (hijaSeleccionada.estado === 'abierta' || hijaSeleccionada.estado === 'impresa')

    const hijaTotal = hijaSeleccionada ? Number(hijaSeleccionada.total) : 0
    const hijaServicio = hijaSeleccionada ? Number(hijaSeleccionada.servicio) : 0
    const hijaSubtotal = hijaSeleccionada ? Number(hijaSeleccionada.subtotal) : 0
    const cambioCalculado = montoRecibido ? parseFloat(montoRecibido) - hijaTotal : 0

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>

            {/* Lista de hijas (20%) */}
            <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
                <button
                    onClick={handleCrearHija}
                    disabled={creando}
                    style={{
                        ...BTN_BASE,
                        border: '2px dashed var(--color-primary)',
                        color: 'var(--color-primary)',
                        justifyContent: 'center',
                        padding: '6px',
                        width: '100%',
                        opacity: creando ? 0.7 : 1,
                        flexShrink: 0,
                    }}
                >
                    <Plus size={14} /> {creando ? 'Creando...' : 'Nueva cuenta'}
                </button>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {hijas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '8px', color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                            Sin cuentas hijas
                        </div>
                    ) : hijas.map(h => {
                        const cfg = ESTADO_CONFIG[h.estado] || ESTADO_CONFIG.abierta
                        const seleccionada = hijaSeleccionada?.id === h.id
                        return (
                            <div
                                key={h.id}
                                onClick={() => {
                                    setEditandoDetalle(null)
                                    onHijaSeleccionada(h)
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 8px',
                                    borderRadius: 8,
                                    border: `1px solid ${seleccionada ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    backgroundColor: 'var(--color-surface)',
                                    color: seleccionada ? 'var(--color-primary)' : 'var(--color-text)',
                                    cursor: 'pointer',
                                    marginBottom: 4,
                                    outline: seleccionada ? '1px solid var(--color-primary)' : 'none',
                                    outlineOffset: '-1px',
                                }}
                            >
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, minWidth: 36, flexShrink: 0 }}>#{h.id}</span>

                                {editandoDetalle === h.id ? (
                                    <input
                                        autoFocus
                                        value={valorDetalle}
                                        onChange={e => setValorDetalle(e.target.value)}
                                        onBlur={() => handleGuardarDetalle(h.id)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleGuardarDetalle(h.id)
                                            if (e.key === 'Escape') setEditandoDetalle(null)
                                        }}
                                        onClick={e => e.stopPropagation()}
                                        style={{
                                            flex: 1,
                                            border: 'none',
                                            borderBottom: '1px solid var(--color-primary)',
                                            background: 'transparent',
                                            color: 'var(--color-text)',
                                            fontSize: '0.75rem',
                                            outline: 'none',
                                            minWidth: 0,
                                        }}
                                    />
                                ) : (
                                    <span
                                        onClick={e => iniciarEdicionDetalle(e, h)}
                                        title="Click para editar detalle"
                                        style={{
                                            flex: 1,
                                            fontSize: '0.75rem',
                                            color: h.detalle ? 'var(--color-text)' : 'var(--color-text-secondary)',
                                            fontStyle: h.detalle ? 'normal' : 'italic',
                                            cursor: 'text',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {h.detalle || 'Sin detalle'}
                                    </span>
                                )}

                                <span style={{
                                    border: `1px solid ${cfg.color}`,
                                    color: cfg.color,
                                    borderRadius: 4,
                                    padding: '2px 5px',
                                    fontSize: '0.58rem',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                }}>
                                    {cfg.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Separador */}
            <div style={{ borderTop: '1px solid var(--color-border)', flexShrink: 0 }} />

            {/* Panel inferior: items hija + totales + acciones (80%) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden', minHeight: 0 }}>
                {!hijaSeleccionada ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
                        Seleccioná una cuenta hija
                    </div>
                ) : (
                    <>
                        {/* Tabla items hija */}
                        <div style={{ flex: 1, borderRadius: 10, border: '1px solid var(--color-border)', overflowY: 'auto', minHeight: 0 }}>
                            <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1 }}>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ padding: '5px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'center', width: 40 }}>Cant</th>
                                        <th style={{ padding: '5px 8px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Descripción</th>
                                        <th style={{ padding: '5px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsHija.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                                Sin items
                                            </td>
                                        </tr>
                                    ) : itemsHija.map(item => {
                                        const esteSeleccionado = itemHijaSeleccionado?.id === item.id
                                        return (
                                            <tr
                                                key={item.id}
                                                onClick={() => onItemHijaSeleccionado(esteSeleccionado ? null : item)}
                                                style={{
                                                    borderBottom: '1px solid var(--color-border)',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'var(--color-surface)',
                                                    color: esteSeleccionado ? 'var(--color-primary)' : 'var(--color-text)',
                                                    outline: esteSeleccionado ? '2px solid var(--color-primary)' : 'none',
                                                    outlineOffset: '-2px',
                                                    transition: 'all 0.1s ease',
                                                }}
                                            >
                                                <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: esteSeleccionado ? 700 : 400 }}>{item.cantidad}</td>
                                                <td style={{ padding: '5px 8px' }}>{item.descripcion}</td>
                                                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>₡{Number(item.total).toLocaleString('es-CR')}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Totales de la hija */}
                        <div style={{ borderRadius: 10, border: '1px solid var(--color-border)', padding: '8px 12px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                                <span style={{ color: 'var(--color-text)' }}>₡{hijaSubtotal.toLocaleString('es-CR')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Servicio 10%</span>
                                <span style={{ color: 'var(--color-text)' }}>₡{hijaServicio.toLocaleString('es-CR')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 4, marginTop: 2 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>Total</span>
                                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-success)' }}>
                                    ₡{hijaTotal.toLocaleString('es-CR')}
                                </span>
                            </div>
                        </div>

                        {/* Botones de acción de la hija */}
                        {esEditable && (
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setModalAnular(true)}
                                    style={{ ...BTN_BASE, border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                                >
                                    Anular
                                </button>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                    <button
                                        onClick={handleImprimirHija}
                                        style={{ ...BTN_BASE, border: '1px solid var(--color-btn-secondary-border)', color: 'var(--color-btn-secondary-text)' }}
                                    >
                                        Imprimir
                                    </button>
                                    <button
                                        onClick={() => { setModalPago(true); setTipoPago('efectivo'); setMontoRecibido('') }}
                                        style={{ ...BTN_BASE, border: '1px solid var(--color-success)', color: 'var(--color-success)' }}
                                    >
                                        Pagar
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal anular hija */}
            <ModalConfirmacionHija
                show={modalAnular}
                onHide={() => setModalAnular(false)}
                titulo={`Anular hija #${hijaSeleccionada?.id}`}
                descripcion="¿Estás seguro de que querés anular esta cuenta? Esta acción no se puede deshacer."
                onConfirmar={handleAnularHija}
                colorBtn="var(--color-danger)"
                textoBtn="Sí, anular"
                procesando={procesando}
            />

            {/* Modal pago hija */}
            <Modal show={modalPago} onHide={() => setModalPago(false)} centered animation={false} contentClassName="border-0 bg-transparent">
                <div style={{ borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ background: GRADIENTS.bosque, padding: '1.25rem 1.5rem' }}>
                        <div className="d-flex align-items-center justify-content-between">
                            <span className="fw-bold text-white fs-5">Cobrar #{hijaSeleccionada?.id}</span>
                            <button onClick={() => setModalPago(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                        <div className="text-white opacity-70 small mt-1">
                            Total: <strong>₡{hijaTotal.toLocaleString('es-CR')}</strong>
                        </div>
                    </div>

                    <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
                            {['efectivo', 'tarjeta'].map(tipo => (
                                <button
                                    key={tipo}
                                    onClick={() => setTipoPago(tipo)}
                                    style={{
                                        flex: 1, padding: '8px', borderRadius: 8,
                                        border: `2px solid ${tipoPago === tipo ? 'var(--color-success)' : 'var(--color-border)'}`,
                                        background: 'transparent',
                                        color: tipoPago === tipo ? 'var(--color-success)' : 'var(--color-btn-secondary-text)',
                                        fontWeight: tipoPago === tipo ? 700 : 400,
                                        fontSize: '0.875rem', cursor: 'pointer', textTransform: 'capitalize',
                                    }}
                                >
                                    {tipo}
                                </button>
                            ))}
                        </div>

                        {tipoPago === 'efectivo' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                                    Monto recibido (₡)
                                </label>
                                <input
                                    autoFocus
                                    type="number"
                                    value={montoRecibido}
                                    onChange={e => setMontoRecibido(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '1.1rem', textAlign: 'right' }}
                                />
                                {montoRecibido && (
                                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>Cambio</span>
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: cambioCalculado >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                            ₡{cambioCalculado.toLocaleString('es-CR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {tipoPago === 'tarjeta' && (
                            <div style={{ padding: '12px', borderRadius: 8, background: 'var(--color-background)', marginBottom: '1rem', textAlign: 'center' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                    ₡{hijaTotal.toLocaleString('es-CR')}
                                </span>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                    Pasar tarjeta por el datafono
                                </div>
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2">
                            <button onClick={() => setModalPago(false)} style={{ ...BTN_BASE, border: '1px solid var(--color-btn-secondary-border)', color: 'var(--color-btn-secondary-text)', padding: '7px 16px' }}>
                                Cancelar
                            </button>
                            <button
                                onClick={handlePagarHija}
                                disabled={procesando || (tipoPago === 'efectivo' && !montoRecibido)}
                                style={{ ...BTN_BASE, border: '1px solid var(--color-success)', color: 'var(--color-success)', opacity: (procesando || (tipoPago === 'efectivo' && !montoRecibido)) ? 0.6 : 1, padding: '7px 16px' }}
                            >
                                {procesando ? 'Procesando...' : 'Confirmar pago'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}