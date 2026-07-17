import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Modal, Spinner } from 'react-bootstrap'
import { Fish, ClipboardList } from 'lucide-react'
import { sileo } from 'sileo'
import { GRADIENTS } from '../../constants/theme'
import TablaItems from './components/TablaItems'
import SelectorProductos from './components/SelectorProductos'
import CantidadModal from './components/CantidadModal'
import PanelDivision from './components/PanelDivision'
import BotonesMover from './components/BotonesMover'
import { imprimirFactura, abrirCaja } from '../../services/impresionService'
import {
    getFactura, getItems, agregarItem, actualizarItem,
    eliminarItem, actualizarEncabezado, actualizarEstado, actualizarTruchasPendientes,
    actualizarTotales, getHijas, moverItems as moverItemsService
} from '../../services/facturasService'
import PanelComandasFactura from './components/PanelComandasFactura'
import { getComandasPorFactura } from '../../services/comandasService'
import { getSaloneros } from '../../services/salonerosService'
import { getMesas } from '../../services/mesasService'
import { getPrecioTruchaVigente } from '../../services/truchaService'
import { socket } from '../../services/socket'

const ESTADO_CONFIG = {
    abierta: { label: 'Abierta', color: 'var(--color-danger)' },
    impresa: { label: 'Impresa', color: 'var(--color-warning)' },
    dividida: { label: 'Dividida', color: 'var(--color-info)' },
    pagada: { label: 'Pagada', color: 'var(--color-success)' },
    anulada: { label: 'Anulada', color: 'var(--color-text-secondary)' },
}

const BTN_BASE = {
    borderRadius: 8,
    padding: '8px 18px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: 600,
    border: 'none',
}

const BTN_OUTLINE = {
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontWeight: 500,
    background: 'transparent',
}

const esEditable = (estado) => estado === 'abierta' || estado === 'impresa'

const ModalConfirmacion = ({ show, onHide, titulo, descripcion, onConfirmar, colorBtn, textoBtn, procesando }) => (
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
                    <button onClick={onHide} style={{ ...BTN_OUTLINE, border: '1px solid var(--color-btn-secondary-border)', color: 'var(--color-btn-secondary-text)' }}>
                        Cancelar
                    </button>
                    <button onClick={onConfirmar} disabled={procesando} style={{ ...BTN_BASE, background: colorBtn, color: 'white', opacity: procesando ? 0.6 : 1 }}>
                        {procesando ? 'Procesando...' : textoBtn}
                    </button>
                </div>
            </div>
        </div>
    </Modal>
)

export default function FacturaPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [factura, setFactura] = useState(null)
    const [items, setItems] = useState([])
    const [saloneros, setSaloneros] = useState([])
    const [mesas, setMesas] = useState([])
    const [precioTruchaGramo, setPrecioTruchaGramo] = useState(0)
    const [cargando, setCargando] = useState(true)

    const [cobrarServicio, setCobrarServicio] = useState(true)
    const [descuento, setDescuento] = useState(0)
    const [truchasPendientes, setTruchasPendientes] = useState(0)
    const [mostrarTrucha, setMostrarTrucha] = useState(false)
    const [gramosTrucha, setGramosTrucha] = useState('')
    const [itemVerificado, setItemVerificado] = useState(null)

    const [productoSeleccionado, setProductoSeleccionado] = useState(null)
    const [modalCantidad, setModalCantidad] = useState(false)
    const [modalAnular, setModalAnular] = useState(false)
    const [modalDividir, setModalDividir] = useState(false)
    const [modalPago, setModalPago] = useState(false)
    const [tipoPago, setTipoPago] = useState('efectivo')
    const [montoRecibido, setMontoRecibido] = useState('')
    const [procesando, setProcesando] = useState(false)
    const [focusTrigger, setFocusTrigger] = useState(0)

    const [hijas, setHijas] = useState([])
    const [hijaSeleccionada, setHijaSeleccionada] = useState(null)
    const [itemsHija, setItemsHija] = useState([])
    const [itemPadreSeleccionado, setItemPadreSeleccionado] = useState(null)
    const [itemHijaSeleccionado, setItemHijaSeleccionado] = useState(null)

    const [vistaPanel, setVistaPanel] = useState('productos') // 'productos' | 'comandas'
    const [comandasFactura, setComandasFactura] = useState([])
    const [cargandoComandas, setCargandoComandas] = useState(false)
    const [itemsRevisados, setItemsRevisados] = useState(new Set())

    const cargar = useCallback(async () => {
        try {
            const [f, its, sals, mess, trucha] = await Promise.all([
                getFactura(id),
                getItems(id),
                getSaloneros(),
                getMesas(),
                getPrecioTruchaVigente(),
            ])
            setFactura(f)
            setTruchasPendientes(f.truchas_pendientes_cocina || 0)
            setItems(its)
            setSaloneros(sals)
            setMesas(mess)
            setPrecioTruchaGramo(trucha?.precio_gramo ? parseFloat(trucha.precio_gramo) : 0)
            setMostrarTrucha(f.tiene_trucha)
            setGramosTrucha(f.trucha_gramos ? String(f.trucha_gramos) : '')
            setCobrarServicio(true)

            if (f.subtotal > 0 && f.descuento > 0) {
                const pct = Math.round((Number(f.descuento) / Number(f.subtotal)) * 100)
                setDescuento(pct)
            }

            if (f.estado === 'dividida') {
                const hijasData = await getHijas(id)
                setHijas(hijasData)
            }
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo cargar la factura' })
            navigate('/mesas')
        } finally {
            setCargando(false)
        }
    }, [id, navigate])

    useEffect(() => { cargar() }, [cargar])

    const refrescarPorComanda = useCallback(async () => {
        try {
            const [f, its] = await Promise.all([getFactura(id), getItems(id)])
            setFactura(f)
            setItems(its)
            setTruchasPendientes(f.truchas_pendientes_cocina || 0)
        } catch {
            // silencioso: si falla, el usuario igual puede refrescar manualmente
        }
    }, [id])



    useEffect(() => {
        if (hijaSeleccionada) {
            getItems(hijaSeleccionada.id).then(setItemsHija).catch(() => { })
        } else {
            setItemsHija([])
        }
    }, [hijaSeleccionada])

    useEffect(() => {
        if (cargando || !factura) return
        const timeout = setTimeout(() => {
            actualizarTruchasPendientes(id, truchasPendientes).catch(() => { })
        }, 600)
        return () => clearTimeout(timeout)
    }, [truchasPendientes])

    useEffect(() => {
        if (cargando || !factura) return
        const timeout = setTimeout(() => {
            recargarFactura()
        }, 600)
        return () => clearTimeout(timeout)
    }, [mostrarTrucha, gramosTrucha])

    const totalUnidades = items.reduce((acc, i) => acc + i.cantidad, 0)

    const recargarFactura = useCallback(async (desc = descuento, servicio = cobrarServicio) => {
        const montoDescuento = factura?.subtotal
            ? (Number(factura.subtotal) * desc) / 100
            : 0

        const datosTrucha = mostrarTrucha ? {
            tiene_trucha: true,
            trucha_gramos: gramosTrucha ? parseFloat(gramosTrucha) : null,
            trucha_precio_gramo: precioTruchaGramo || null,
            trucha_total: gramosTrucha && precioTruchaGramo
                ? parseFloat(gramosTrucha) * precioTruchaGramo
                : null,
        } : {
            tiene_trucha: false,
            trucha_gramos: null,
            trucha_precio_gramo: null,
            trucha_total: null,
        }

        const f = await actualizarTotales(id, {
            descuento: montoDescuento,
            cobrar_servicio: servicio,
            ...datosTrucha,
        })
        setFactura(f)
        return f
    }, [id, factura, descuento, cobrarServicio, mostrarTrucha, gramosTrucha, precioTruchaGramo])

    const refrescarDivision = async (hijaId, resetearSeleccion = true) => {
        const [hijasActualizadas, itemsPadreActualizados] = await Promise.all([
            getHijas(id),
            getItems(id),
        ])
        setHijas(hijasActualizadas)
        setItems(itemsPadreActualizados)

        const facturaActualizada = await getFactura(id)
        setFactura(facturaActualizada)

        if (hijaId) {
            const hijaActualizada = hijasActualizadas.find(h => h.id === hijaId)
            if (hijaActualizada) {
                setHijaSeleccionada(hijaActualizada)
                const itsHija = await getItems(hijaId)
                setItemsHija(itsHija)
            }
        }

        if (resetearSeleccion) {
            setItemPadreSeleccionado(null)
            setItemHijaSeleccionado(null)
        }
    }

    const handleMover = async (tipo) => {
        const esDerecha = tipo.endsWith('derecha')
        const tipoMovimiento = tipo.replace('_derecha', '').replace('_izquierda', '')

        if (!hijaSeleccionada) {
            sileo.warning({ title: 'Sin hija seleccionada', description: 'Selecciona una cuenta hija primero' })
            return
        }

        if (esDerecha) {
            if (tipoMovimiento !== 'todo' && !itemPadreSeleccionado) {
                sileo.warning({ title: 'Sin item seleccionado', description: 'Selecciona un item del padre para mover' })
                return
            }
            try {
                const itemMovidoProductoId = itemPadreSeleccionado?.producto_id
                const cantidadOriginal = itemPadreSeleccionado?.cantidad

                await moverItemsService(id, {
                    tipo: tipoMovimiento,
                    itemId: itemPadreSeleccionado?.id,
                    facturaDestinoId: hijaSeleccionada.id,
                })
                sileo.success({ title: 'Item movido', description: 'Movido a la cuenta hija' })

                const itemsPadreActualizados = await getItems(id)
                setItems(itemsPadreActualizados)

                if (tipoMovimiento === 'uno' && cantidadOriginal > 1) {
                    const remanente = itemsPadreActualizados.find(i => i.producto_id === itemMovidoProductoId)
                    setItemPadreSeleccionado(remanente || null)
                } else {
                    setItemPadreSeleccionado(null)
                }

                await refrescarDivision(hijaSeleccionada.id, false)
            } catch {
                sileo.error({ title: 'Error', description: 'No se pudo mover el item' })
            }
        } else {
            if (tipoMovimiento !== 'todo' && !itemHijaSeleccionado) {
                sileo.warning({ title: 'Sin item seleccionado', description: 'Selecciona un item de la hija para regresar' })
                return
            }
            try {
                const itemMovidoProductoId = itemHijaSeleccionado?.producto_id
                const cantidadOriginal = itemHijaSeleccionado?.cantidad

                await moverItemsService(hijaSeleccionada.id, {
                    tipo: tipoMovimiento,
                    itemId: itemHijaSeleccionado?.id,
                    facturaDestinoId: id,
                })
                sileo.success({ title: 'Item regresado', description: 'Regresado a la cuenta padre' })

                const itemsHijaActualizados = await getItems(hijaSeleccionada.id)
                setItemsHija(itemsHijaActualizados)

                if (tipoMovimiento === 'uno' && cantidadOriginal > 1) {
                    const remanente = itemsHijaActualizados.find(i => i.producto_id === itemMovidoProductoId)
                    setItemHijaSeleccionado(remanente || null)
                } else {
                    setItemHijaSeleccionado(null)
                }

                await refrescarDivision(hijaSeleccionada.id, false)
            } catch {
                sileo.error({ title: 'Error', description: 'No se pudo regresar el item' })
            }
        }
    }

    const handleToggleServicio = async () => {
        const nuevo = !cobrarServicio
        setCobrarServicio(nuevo)
        try {
            await recargarFactura(descuento, nuevo)
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo actualizar el servicio' })
        }
    }

    const handleCambiarDescuento = async (pct) => {
        setDescuento(pct)
        try {
            const montoDescuento = (Number(factura.subtotal) * pct) / 100
            const f = await actualizarTotales(id, {
                descuento: montoDescuento,
                cobrar_servicio: cobrarServicio,
            })
            setFactura(f)
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo aplicar el descuento' })
        }
    }

    const handleSeleccionarProducto = (producto) => {
        setProductoSeleccionado(producto)
        setModalCantidad(true)
    }

    const handleAgregarItem = async (cantidad) => {
        setModalCantidad(false)
        if (!productoSeleccionado) return
        try {
            await agregarItem(id, {
                producto_id: productoSeleccionado.id,
                descripcion: productoSeleccionado.descripcion,
                precio_unitario: productoSeleccionado.precio,
                cantidad,
            })
            const its = await getItems(id)
            setItems(its)
            await recargarFactura()

            if (productoSeleccionado.descripcion.toLowerCase().includes('trucha')) {
                setTruchasPendientes(prev => Math.max(0, prev - cantidad))
            }

            setFocusTrigger(t => t + 1)
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo agregar el item' })
        }
    }

    const handleActualizarItem = async (itemId, cantidad) => {
        try {
            const itemAnterior = items.find(i => i.id === itemId)
            if (cantidad <= 0) {
                await eliminarItem(id, itemId)
            } else {
                await actualizarItem(id, itemId, cantidad)
            }
            const its = await getItems(id)
            setItems(its)
            await recargarFactura()

            if (itemAnterior?.descripcion.toLowerCase().includes('trucha')) {
                const diff = itemAnterior.cantidad - (cantidad <= 0 ? 0 : cantidad)
                if (diff > 0) setTruchasPendientes(prev => prev + diff)
            }
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo actualizar el item' })
        }
    }

    const handleEliminarItem = async (itemId) => {
        try {
            const itemAnterior = items.find(i => i.id === itemId)
            await eliminarItem(id, itemId)
            const its = await getItems(id)
            setItems(its)
            await recargarFactura()

            if (itemAnterior?.descripcion.toLowerCase().includes('trucha')) {
                setTruchasPendientes(prev => prev + itemAnterior.cantidad)
            }
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo eliminar el item' })
        }
    }

    const handleGuardarEncabezado = async (campo, valor) => {
        if (!factura) return
        try {
            const payload = {
                mesa_id: factura.mesa_id,
                salonero_id: factura.salonero_id,
                detalle: factura.detalle,
                [campo]: valor,
            }
            const f = await actualizarEncabezado(id, payload)
            setFactura(f)
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo guardar' })
        }
    }

    const handleAnular = async () => {
        setProcesando(true)
        try {
            const f = await actualizarEstado(id, { estado: 'anulada' })
            setFactura(f)
            setModalAnular(false)
            sileo.info({ title: 'Factura anulada', description: `#${id} fue anulada` })
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo anular la factura' })
        } finally {
            setProcesando(false)
        }
    }

    const handleDividir = async () => {
        setProcesando(true)
        try {
            const f = await actualizarEstado(id, { estado: 'dividida' })
            setFactura(f)
            setModalDividir(false)
            const hijasData = await getHijas(id)
            setHijas(hijasData)
            sileo.info({ title: 'Factura dividida', description: `#${id} marcada como dividida` })
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo dividir la factura' })
        } finally {
            setProcesando(false)
        }
    }

    const handleImprimir = async () => {
        try {
            const f = await actualizarEstado(id, { estado: 'impresa' })
            setFactura(f)
            await imprimirFactura(id)
            sileo.success({ title: 'Imprimiendo', description: `Factura #${id} enviada a impresora` })
        } catch (err) {
            if (err.response?.data?.sinImpresora) {
                sileo.warning({ title: 'Sin impresora', description: 'No se encontro impresora. El estado fue actualizado.' })
            } else {
                sileo.error({ title: 'Error', description: 'No se pudo imprimir' })
            }
        }
    }

    const handlePagar = async () => {
        const cambioCalculado = tipoPago === 'efectivo' && montoRecibido
            ? parseFloat(montoRecibido) - totalFinal
            : null
        setProcesando(true)
        try {
            const f = await actualizarEstado(id, {
                estado: 'pagada',
                tipo_pago: tipoPago,
                monto_recibido: tipoPago === 'efectivo' ? parseFloat(montoRecibido) : null,
                cambio: cambioCalculado,
            })
            setFactura(f)
            setModalPago(false)

            if (tipoPago === 'efectivo') {
                try { await abrirCaja() } catch {
                    sileo.warning({ title: 'Aviso', description: 'El pago fue registrado pero no se pudo abrir la caja' })
                }
            }

            sileo.success({ title: 'Factura pagada', description: `#${id} cobrada exitosamente` })
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudo registrar el pago' })
        } finally {
            setProcesando(false)
        }
    }
    const cargarComandasFactura = useCallback(async () => {
        setCargandoComandas(true)
        try {
            const data = await getComandasPorFactura(id)
            setComandasFactura(data)
        } catch {
            sileo.error({ title: 'Error', description: 'No se pudieron cargar las comandas' })
        } finally {
            setCargandoComandas(false)
        }
    }, [id])

    useEffect(() => { cargarComandasFactura() }, [cargarComandasFactura])

    const toggleItemRevisado = (itemId) => {
        setItemsRevisados(prev => {
            const next = new Set(prev)
            if (next.has(itemId)) next.delete(itemId)
            else next.add(itemId)
            return next
        })
    }

    useEffect(() => {
        socket.connect()

        const handler = (payload) => {
            if (String(payload?.facturaId) === String(id)) {
                refrescarPorComanda()
                cargarComandasFactura()
            }
        }

        socket.on('factura:actualizar', handler)
        return () => {
            socket.off('factura:actualizar', handler)
            socket.disconnect()
        }
    }, [id, refrescarPorComanda, cargarComandasFactura])

    if (cargando) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '100%' }}>
                <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
            </div>
        )
    }

    if (!factura) return null

    const cfg = ESTADO_CONFIG[factura.estado] || ESTADO_CONFIG.abierta
    const editable = esEditable(factura.estado)
    const esDividida = factura.estado === 'dividida'
    const totalTrucha = gramosTrucha && precioTruchaGramo
        ? parseFloat(gramosTrucha) * precioTruchaGramo
        : 0
    const totalFinal = Number(factura.total) + (mostrarTrucha ? totalTrucha : 0)
    const cambioCalculado = montoRecibido ? parseFloat(montoRecibido) - totalFinal : 0

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 16px',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                flexShrink: 0,
                flexWrap: 'wrap',
            }}>
                {/* CAMBIO 3: etiqueta Mesa: + selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        Mesa:
                    </span>
                    <select
                        value={factura.mesa_id || ''}
                        onChange={e => handleGuardarEncabezado('mesa_id', e.target.value)}
                        disabled={!editable}
                        style={{ width: 70, padding: '4px 6px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.82rem' }}
                    >
                        {mesas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                </div>

                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                    #{factura.id}
                </span>

                <span style={{ border: `1px solid ${cfg.color}`, color: cfg.color, borderRadius: 6, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 600 }}>
                    {cfg.label}
                </span>

                <select
                    value={factura.salonero_id || ''}
                    onChange={e => handleGuardarEncabezado('salonero_id', e.target.value)}
                    disabled={!editable && !esDividida ? true : !editable}
                    style={{ padding: '4px 6px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.82rem' }}
                >
                    {saloneros.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>

                <input
                    type="text"
                    value={factura.detalle || ''}
                    onChange={e => setFactura(f => ({ ...f, detalle: e.target.value }))}
                    onBlur={e => handleGuardarEncabezado('detalle', e.target.value)}
                    disabled={!editable}
                    placeholder="Detalle / cliente..."
                    style={{ flex: 1, minWidth: 120, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.82rem' }}
                />
                {editable && !esDividida && (
                    <button
                        onClick={() => setVistaPanel(v => v === 'productos' ? 'comandas' : 'productos')}
                        style={{ background: 'transparent', border: '1px solid var(--color-btn-secondary-border)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: 'var(--color-btn-secondary-text)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                        <ClipboardList size={14} />
                        {vistaPanel === 'productos' ? 'Ver comandas' : 'Ver productos'}
                    </button>
                )}
            </div>

            {/* Contenido principal */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* Panel izquierdo */}
                <div style={{
                    flex: esDividida ? '0 0 60%' : editable ? '0 0 70%' : '1 1 100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: (esDividida || editable) ? '1px solid var(--color-border)' : 'none',
                    overflow: 'hidden',
                    padding: '12px',
                    gap: 8,
                    minWidth: 0,
                }}>

                    {/* CAMBIO 4: itemVerificado para modo verificacion */}
                    <div style={{ flex: 1, borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <TablaItems
                            items={items}
                            onActualizar={handleActualizarItem}
                            onEliminar={handleEliminarItem}
                            editable={editable}
                            seleccionable={esDividida}
                            itemSeleccionado={itemPadreSeleccionado}
                            onSeleccionar={setItemPadreSeleccionado}
                            itemVerificado={itemVerificado}
                            onVerificar={esDividida ? null : setItemVerificado}
                        />
                    </div>

                    {/* Alertas: solo editable */}
                    {editable && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <div style={{ padding: '6px 12px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                    Items: {totalUnidades}
                                </span>
                            </div>
                            {truchasPendientes > 0 && (
                                <div style={{ flex: 1, padding: '6px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8 }}>
                                    <span style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600 }}>
                                        {truchasPendientes} trucha{truchasPendientes !== 1 ? 's' : ''} pendiente{truchasPendientes !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CAMBIO 1: seccion calculos siempre visible */}
                    <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', padding: '12px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>

                        {/* Truchas pendientes cocina: solo si editable */}
                        {editable && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6, borderBottom: '1px solid var(--color-border)' }}>
                                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Truchas pendientes cocina:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={truchasPendientes}
                                    onChange={e => setTruchasPendientes(parseInt(e.target.value) || 0)}
                                    style={{ width: 56, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.82rem', textAlign: 'center' }}
                                />
                            </div>
                        )}

                        {/* Trucha cruda: boton toggle solo si editable, datos siempre si aplica */}
                        <div>
                            {editable && (
                                <button
                                    onClick={() => setMostrarTrucha(t => !t)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: mostrarTrucha ? 'var(--color-primary)' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: 0 }}
                                >
                                    <Fish size={14} />
                                    {mostrarTrucha ? 'Quitar trucha cruda' : 'Agregar trucha cruda'}
                                </button>
                            )}

                            {mostrarTrucha && (
                                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {editable ? (
                                        <>
                                            <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Gramos:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={gramosTrucha}
                                                onChange={e => setGramosTrucha(e.target.value)}
                                                style={{ width: 80, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.82rem' }}
                                            />
                                        </>
                                    ) : (
                                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                                            Trucha cruda: {gramosTrucha}g
                                        </span>
                                    )}
                                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                                        x ₡{precioTruchaGramo.toLocaleString('es-CR')}/g = <strong style={{ color: 'var(--color-text)' }}>₡{totalTrucha.toLocaleString('es-CR')}</strong>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Totales siempre visibles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                                <span>₡{Number(factura.subtotal).toLocaleString('es-CR')}</span>
                            </div>

                            {/* Servicio: editable con checkbox, readonly como texto */}
                            {editable ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={cobrarServicio} onChange={handleToggleServicio} />
                                        Servicio 10%
                                    </label>
                                    <span>₡{Number(factura.servicio).toLocaleString('es-CR')}</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Servicio 10%</span>
                                    <span>₡{Number(factura.servicio).toLocaleString('es-CR')}</span>
                                </div>
                            )}

                            {/* Descuento: editable con select, readonly solo si tiene valor */}
                            {editable ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                    <label style={{ color: 'var(--color-text-secondary)' }}>Descuento</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {descuento > 0 && (
                                            <span style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                                                -₡{Number(factura.descuento).toLocaleString('es-CR')}
                                            </span>
                                        )}
                                        <select
                                            value={descuento}
                                            onChange={e => handleCambiarDescuento(Number(e.target.value))}
                                            style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: descuento > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontSize: '0.82rem' }}
                                        >
                                            <option value={0}>Sin descuento</option>
                                            <option value={5}>5%</option>
                                            <option value={10}>10%</option>
                                            <option value={15}>15%</option>
                                            <option value={20}>20%</option>
                                            <option value={25}>25%</option>
                                        </select>
                                    </div>
                                </div>
                            ) : Number(factura.descuento) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Descuento</span>
                                    <span style={{ color: 'var(--color-danger)' }}>-₡{Number(factura.descuento).toLocaleString('es-CR')}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 2 }}>
                                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>Total</span>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>
                                    ₡{Number(factura.total).toLocaleString('es-CR')}
                                </span>
                            </div>

                            {mostrarTrucha && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>Trucha cruda</span>
                                        <span>₡{totalTrucha.toLocaleString('es-CR')}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 2 }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>Total final</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-primary)' }}>
                                            ₡{totalFinal.toLocaleString('es-CR')}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* CAMBIO 2: botones con fondo solido, solo si editable */}
                    {editable && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                            <button onClick={() => setModalAnular(true)} style={{ ...BTN_BASE, background: 'var(--color-danger)', color: 'var(--color-text-bg)' }}>
                                Anular
                            </button>
                            <button onClick={() => setModalDividir(true)} style={{ ...BTN_BASE, background: 'var(--color-info)', color: 'var(--color-text-bg)' }}>
                                Dividir
                            </button>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                <button onClick={handleImprimir} style={{ ...BTN_BASE, background: 'var(--color-surface)', border: '2px solid var(--color-btn-secondary-border)', color: 'var(--color-btn-secondary-text)' }}>
                                    Imprimir
                                </button>
                                <button
                                    onClick={() => { setModalPago(true); setTipoPago('efectivo'); setMontoRecibido('') }}
                                    style={{ ...BTN_BASE, background: 'var(--color-primary)', color: 'var(--color-text-bg)' }}
                                >
                                    Pagar
                                </button>
                            </div>
                        </div>
                    )}

                    {esDividida && items.length === 0 && (
                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>
                            Todos los items fueron distribuidos
                        </div>
                    )}
                </div>

                {esDividida && <BotonesMover onMover={handleMover} />}

                {esDividida ? (
                    <div style={{ flex: 1, minWidth: 0, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid var(--color-border)' }}>
                        <PanelDivision
                            facturapadreId={id}
                            hijas={hijas}
                            hijaSeleccionada={hijaSeleccionada}
                            itemsHija={itemsHija}
                            itemHijaSeleccionado={itemHijaSeleccionado}
                            onItemHijaSeleccionado={setItemHijaSeleccionado}
                            onHijaSeleccionada={(h) => {
                                setHijaSeleccionada(h)
                                setItemHijaSeleccionado(null)
                            }}
                            onRefrescar={refrescarDivision}
                        />
                    </div>
                ) : editable ? (
                    <div style={{ flex: '0 0 30%', minWidth: 0, padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {vistaPanel === 'productos' ? (
                            <SelectorProductos
                                onSeleccionar={handleSeleccionarProducto}
                                focusTrigger={focusTrigger}
                            />
                        ) : (
                            <PanelComandasFactura
                                comandas={comandasFactura}
                                cargando={cargandoComandas}
                                revisados={itemsRevisados}
                                onToggleRevisado={toggleItemRevisado}
                            />
                        )}
                    </div>
                ) : null}
            </div>

            <CantidadModal
                show={modalCantidad}
                onHide={() => setModalCantidad(false)}
                producto={productoSeleccionado}
                onConfirmar={handleAgregarItem}
            />

            <ModalConfirmacion
                show={modalAnular}
                onHide={() => setModalAnular(false)}
                titulo="Anular factura"
                descripcion={`Esta seguro de que queres anular la factura #${id}? Esta accion no se puede deshacer.`}
                onConfirmar={handleAnular}
                colorBtn="var(--color-danger)"
                textoBtn="Si, anular"
                procesando={procesando}
            />

            <ModalConfirmacion
                show={modalDividir}
                onHide={() => setModalDividir(false)}
                titulo="Dividir factura"
                descripcion={`Queres marcar la factura #${id} como dividida? No podra editarse directamente despues.`}
                onConfirmar={handleDividir}
                colorBtn="var(--color-info)"
                textoBtn="Si, dividir"
                procesando={procesando}
            />

            <Modal show={modalPago} onHide={() => setModalPago(false)} centered animation={false} contentClassName="border-0 bg-transparent">
                <div style={{ borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--color-primary)', padding: '1.25rem 1.5rem' }}>
                        <div className="d-flex align-items-center justify-content-between">
                            <span className="fw-bold fs-5" style={{ color: 'var(--color-text-bg)' }}>Cobrar factura #{id}</span>
                            <button onClick={() => setModalPago(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--color-text-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                        <div className="opacity-70 small mt-1" style={{ color: 'var(--color-text-bg)' }}>
                            Total a cobrar: <strong>₡{totalFinal.toLocaleString('es-CR')}</strong>
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
                                        border: `2px solid ${tipoPago === tipo ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        background: 'transparent',
                                        color: tipoPago === tipo ? 'var(--color-primary)' : 'var(--color-btn-secondary-text)',
                                        fontWeight: tipoPago === tipo ? 700 : 400,
                                        fontSize: '0.875rem', cursor: 'pointer', textTransform: 'capitalize',
                                    }}
                                >
                                    {tipo}
                                </button>
                            ))}
                        </div>

                        {tipoPago === 'efectivo' && (
                            <div style={{ padding: '12px', borderRadius: 8, background: 'var(--color-background)', marginBottom: '1rem', textAlign: 'center' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    ₡{totalFinal.toLocaleString('es-CR')}
                                </span>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4, textAlign: 'start' }}>
                                        Monto recibido
                                    </label>
                                    <input
                                        autoFocus
                                        type="number"
                                        value={montoRecibido}
                                        onChange={e => setMontoRecibido(e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '1.1rem', textAlign: 'right' }}
                                    />
                                    {montoRecibido && (
                                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>Cambio</span>
                                            <span style={{ fontWeight: 700, fontSize: '1.5rem', color: cambioCalculado >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                                                ₡{cambioCalculado.toLocaleString('es-CR')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {tipoPago === 'tarjeta' && (
                            <div style={{ padding: '12px', borderRadius: 8, background: 'var(--color-background)', marginBottom: '1rem', textAlign: 'center' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    ₡{totalFinal.toLocaleString('es-CR')}
                                </span>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                    Cobrar por el datafono
                                </div>
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2">
                            <button onClick={() => setModalPago(false)} style={{ ...BTN_OUTLINE, border: '1px solid var(--color-btn-secondary-border)', color: 'var(--color-btn-secondary-text)' }}>
                                Cancelar
                            </button>
                            <button
                                onClick={handlePagar}
                                disabled={procesando || (tipoPago === 'efectivo' && !montoRecibido)}
                                style={{ ...BTN_BASE, background: 'var(--color-primary)', color: 'white', opacity: (procesando || (tipoPago === 'efectivo' && !montoRecibido)) ? 0.6 : 1 }}
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