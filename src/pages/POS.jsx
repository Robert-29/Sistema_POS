import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import {
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    ArrowRight,
    CheckCircle2,
    X,
    Package,
    AlertTriangle,
    ArrowLeft,
    LogIn,
    LogOut,
    Monitor,
    User,
    Edit3
} from 'lucide-react';

const POS = () => {
    const { user, business, posSession, employeeSession, initialize } = useStore();
    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [procesandoVenta, setProcesandoVenta] = useState(false);
    const [mostrarTicket, setMostrarTicket] = useState(false);
    const [ultimaVenta, setUltimaVenta] = useState(null);

    // Estados para modificar stock
    const [editingStockItem, setEditingStockItem] = useState(null);
    const [newStockValue, setNewStockValue] = useState('');
    const [updatingStock, setUpdatingStock] = useState(false);

    const [mostrarModalProducto, setMostrarModalProducto] = useState(false);

    useEffect(() => {
        if (business) {
            fetchInitialData();
        }
    }, [business]);

    const handleCrearProductoDesdePOS = async (datos) => {
        setUpdatingStock(true);
        try {
            const idSucursal = employeeSession?.id_sucursal || posSession?.pos?.id_sucursal;
            if (!idSucursal) throw new Error('No se puede crear producto sin sucursal identificada.');

            // Preparar payload básico
            const payload = {
                nombre: datos.nombre,
                precio: parseFloat(datos.precio),
                stock: 0, // El stock se maneja vía RPC o stock_sucursales
                codigo_barras: datos.codigo,
                id_negocio: business.id
            };

            const rpcPayload = {
                p_employee_id: employeeSession?.user?.id || posSession?.pos?.id,
                p_product_data: payload,
                p_stock_sucursales: [{
                    id_sucursal: idSucursal,
                    cantidad: parseInt(datos.stock)
                }],
                p_operation: 'INSERT'
            };

            const { error: rpcError } = await supabase.rpc('manage_product', rpcPayload);
            if (rpcError) throw rpcError;

            alert('Producto creado exitosamente');
            setMostrarModalProducto(false);
            fetchInitialData();
        } catch (err) {
            alert('Error al crear producto: ' + err.message);
        } finally {
            setUpdatingStock(false);
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const idNegocio = business?.id;
            const idSucursal = employeeSession?.id_sucursal || posSession?.pos?.id_sucursal;

            let query = supabase
                .from('productos')
                .select(`
                    *,
                    stock_sucursales(id_sucursal, cantidad)
                `)
                .eq('id_negocio', idNegocio);

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching products:', error);
            } else {
                // Mapear stock según tipo de inventario y filtrar por sucursal
                const mappedData = (data || []).reduce((acc, p) => {
                    let stockActual = p.stock;
                    let shouldInclude = true;

                    if (business.tipo_inventario !== 'unico' && idSucursal) {
                        const sStock = p.stock_sucursales?.find(s => s.id_sucursal === idSucursal);
                        stockActual = sStock ? sStock.cantidad : 0;

                        // Si se requiere que SOLO se muestren los de la sucursal:
                        // Podemos asumir que si no hay registro en stock_sucursales, no "pertenece" a la sucursal,
                        // o simplemente mostramos con stock 0.
                        // El usuario dijo: "solo quiero que se muestren los productos de mi sucursal".
                        // Interpretación estricta: Si no existe en stock_sucursales para esta ID, no mostrar.
                        if (!sStock) shouldInclude = false;
                    }

                    if (shouldInclude) {
                        acc.push({ ...p, stockActual });
                    }
                    return acc;
                }, []);

                setProductos(mappedData);
            }
        } catch (err) {
            console.error('Error fetching initial data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = async (e) => {
        e.preventDefault();
        setUpdatingStock(true);
        try {
            const idSucursal = employeeSession?.id_sucursal || posSession?.pos?.id_sucursal;
            const nuevoStock = parseInt(newStockValue);

            if (isNaN(nuevoStock) || nuevoStock < 0) {
                alert('Por favor ingresa una cantidad válida');
                return;
            }

            if (business.tipo_inventario === 'unico') {
                // Stock Global
                const { error } = await supabase
                    .from('productos')
                    .update({ stock: nuevoStock })
                    .eq('id', editingStockItem.id);
                if (error) throw error;
            } else {
                // Stock por Sucursal
                if (!idSucursal) throw new Error('No se identificó la sucursal para actualizar el stock');

                // Usamos upsert para asegurar que exista el registro de stock
                const { error } = await supabase
                    .from('stock_sucursales')
                    .upsert({
                        id_producto: editingStockItem.id,
                        id_sucursal: idSucursal,
                        id_negocio: business.id,
                        cantidad: nuevoStock
                    }, { onConflict: 'id_producto,id_sucursal' });

                if (error) throw error;
            }

            // Registrar en auditoría
            await supabase.from('logs_auditoria').insert([{
                id_negocio: business.id,
                id_sucursal: idSucursal,
                accion: 'AJUSTE_MANUAL_POS',
                detalles: `Ajuste manual de stock para ${editingStockItem.nombre} a ${nuevoStock} unidades desde POS`
            }]);

            await fetchInitialData();
            setEditingStockItem(null);
            setNewStockValue('');
        } catch (err) {
            alert('Error al actualizar stock: ' + err.message);
        } finally {
            setUpdatingStock(false);
        }
    };

    const agregarAlCarrito = (producto) => {
        setCarrito(prev => {
            const existente = prev.find(item => item.id === producto.id);
            if (existente) {
                if (existente.cantidad >= producto.stockActual) return prev;
                return prev.map(item =>
                    item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            }
            return [...prev, { ...producto, cantidad: 1 }];
        });
    };

    const actualizarCantidad = (id, delta) => {
        setCarrito(prev => prev.map(item => {
            if (item.id === id) {
                const nuevaCantidad = item.cantidad + delta;
                const productoOriginal = productos.find(p => p.id === id);
                if (nuevaCantidad > 0 && nuevaCantidad <= (productoOriginal?.stockActual || 0)) {
                    return { ...item, cantidad: nuevaCantidad };
                }
            }
            return item;
        }));
    };

    const eliminarDelCarrito = (id) => {
        setCarrito(prev => prev.filter(item => item.id !== id));
    };

    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    const ejecutarVenta = async () => {
        if (carrito.length === 0) return;
        setProcesandoVenta(true);

        try {
            const idNegocio = business?.id; // Now BIGINT
            const idSucursal = employeeSession?.id_sucursal || posSession?.pos?.id_sucursal; // Now BIGINT
            const idPuntoVenta = posSession?.pos?.id || null; // Now BIGINT

            if (!idNegocio) throw new Error('No se pudo identificar el negocio. Por favor, re-inicia sesión.');

            // Si inventario es por sucursal, es CRÍTICO tener el idSucursal
            if (business.tipo_inventario !== 'unico' && !idSucursal) {
                throw new Error('No se identificó la sucursal para procesar la venta.');
            }

            // Validar permiso de venta si es empleado (redundancia del lado del cliente)
            if (employeeSession && employeeSession.permisos && !employeeSession.permisos.can_sell) {
                throw new Error('No tienes permiso para realizar ventas.');
            }

            // Determinar Vendedor (Owner vs Empleado)
            let p_vendedor_id_uuid = null;
            let p_id_empleado = null;

            if (employeeSession) {
                p_id_empleado = employeeSession.user.id; // BIGINT
            } else if (posSession) {
                // POS session sin empleado explicito? Asumimos owner venta rapida? Or POS user? -> POS user is usually simple.
                // But wait, POS session usually requires employee login overlay.
                // Assuming "Owner" logic if user is present in store (Admin)
                // If pure POS session, we might track it differently.
                // For now, if no employeeSession but 'user' exists in store, it's owner.
                if (user) {
                    p_vendedor_id_uuid = user.id; // UUID from Auth
                } else {
                    // Fallback or error? Logic above handles 'CajeroLogin' if !employeeSession.
                }
            } else if (user) {
                p_vendedor_id_uuid = user.id; // UUID
            }

            // Preparar items para el RPC
            const itemsPayload = carrito.map(item => ({
                id: item.id,
                cantidad: item.cantidad,
                precio: item.precio
            }));

            // Llamar al RPC seguro
            const { data: rpcData, error: rpcError } = await supabase.rpc('process_sale', {
                p_id_negocio: idNegocio,
                p_id_sucursal: idSucursal || null,
                p_vendedor_id_uuid: p_vendedor_id_uuid, // UUID for Owner
                p_id_empleado: p_id_empleado,           // BIGINT for Employee
                p_id_punto_venta: idPuntoVenta,
                p_total: total,
                p_metodo_pago: metodoPago,
                p_items: itemsPayload
            });

            if (rpcError) throw rpcError;

            // Éxito
            const ventaId = rpcData.venta_id;

            // Construimos objeto de venta para mostrar en el ticket (UI)
            const ventaParaTicket = {
                id: ventaId,
                total: total,
                metodo_pago: metodoPago,
                items: carrito
            };

            setUltimaVenta(ventaParaTicket);
            setCarrito([]);
            setMostrarTicket(true);
            fetchInitialData(); // Recargar stock actualizado

        } catch (err) {
            console.error('Error venta:', err);
            alert('Error al procesar la venta: ' + err.message);
        } finally {
            setProcesandoVenta(false);
        }
    };

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigo_barras && p.codigo_barras.includes(searchTerm))
    );

    // --- RENDERIZADO DE LOGIN DE CAJERO ---
    if (posSession && !employeeSession && !user) {
        return (
            <CajeroLogin terminal={posSession} onLogin={(emp) => initialize()} />
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Cargando configuración del negocio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <ShoppingCart className="w-7 h-7 text-blue-600" />
                                Punto de Venta
                            </h1>
                            <p className="text-sm font-bold text-slate-500 ml-9 bg-blue-50 px-3 py-1 rounded-lg inline-block mt-1">
                                Sucursal: {employeeSession?.sucursales?.nombre || posSession?.pos?.sucursales?.nombre || 'Principal'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" />
                                {employeeSession?.user?.nombre || user?.nombre_negocio || 'Administrador'}
                            </span>
                            {(employeeSession || user) && (
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('employee_session');
                                        initialize();
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-white rounded-xl border border-slate-100 shadow-sm"
                                    title="Cerrar Turno"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border-0 ring-1 ring-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-lg"
                        />
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white h-48 rounded-3xl animate-pulse border border-slate-50"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {productosFiltrados.map(producto => (
                                <div
                                    key={producto.id}
                                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all text-left flex flex-col group relative overflow-hidden"
                                >
                                    {/* Botón flotante para editar stock */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingStockItem(producto);
                                            setNewStockValue(producto.stockActual.toString());
                                        }}
                                        className="absolute top-3 right-3 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors z-10"
                                        title="Modificar Stock"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>

                                    <div
                                        onClick={() => agregarAlCarrito(producto)}
                                        className="flex-1 flex flex-col cursor-pointer active:scale-95 transition-transform"
                                    >
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                            <Package className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{producto.nombre}</h3>
                                        <div className="mt-auto pt-4 flex justify-between items-end">
                                            <span className="text-xl font-bold text-blue-600">
                                                {business?.moneda === 'USD' ? '$' : business?.moneda} {producto.precio.toFixed(2)}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${producto.stockActual < 10 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'
                                                }`}>
                                                Stock: {producto.stockActual}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-[400px]">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-28 overflow-hidden h-[calc(100vh-140px)] flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-slate-900">Carrito de Venta</h2>
                            <span className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full text-xs">
                                {carrito.length} items
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {carrito.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                    <ShoppingCart className="w-12 h-12 mb-3 opacity-10" />
                                    <p className="font-medium">El carrito está vacío</p>
                                    <p className="text-xs">Selecciona productos de la izquierda</p>
                                </div>
                            ) : (
                                carrito.map(item => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 text-sm">{item.nombre}</p>
                                            <p className="text-blue-600 font-bold text-xs">{business?.moneda === 'USD' ? '$' : business?.moneda} {item.precio.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                                            <button
                                                onClick={() => actualizarCantidad(item.id, -1)}
                                                className="p-1 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-6 text-center font-bold text-slate-900 text-sm">{item.cantidad}</span>
                                            <button
                                                onClick={() => actualizarCantidad(item.id, 1)}
                                                className="p-1 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => eliminarDelCarrito(item.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 mt-auto">
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center text-slate-500 font-medium">
                                    <span>Subtotal</span>
                                    <span>{business?.moneda === 'USD' ? '$' : business?.moneda} {(total * 0.85).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-500 font-medium pb-4 border-b border-slate-200/50">
                                    <span>Impuestos (15%)</span>
                                    <span>{business?.moneda === 'USD' ? '$' : business?.moneda} {(total * 0.15).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold text-slate-900">Total</span>
                                    <span className="text-3xl font-extrabold text-blue-600">{business?.moneda === 'USD' ? '$' : business?.moneda} {total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <PaymentMethod
                                    active={metodoPago === 'efectivo'}
                                    onClick={() => setMetodoPago('efectivo')}
                                    icon={<Banknote className="w-5 h-5" />}
                                    label="Efectivo"
                                />
                                <PaymentMethod
                                    active={metodoPago === 'tarjeta'}
                                    onClick={() => setMetodoPago('tarjeta')}
                                    icon={<CreditCard className="w-5 h-5" />}
                                    label="Tarjeta"
                                />
                                <PaymentMethod
                                    active={metodoPago === 'transferencia'}
                                    onClick={() => setMetodoPago('transferencia')}
                                    icon={<ArrowRight className="w-5 h-5 rotate-45" />}
                                    label="Transf."
                                />
                            </div>

                            <button
                                onClick={ejecutarVenta}
                                disabled={carrito.length === 0 || procesandoVenta}
                                className="w-full bg-blue-600 text-white font-bold py-5 rounded-[24px] shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-slate-300 flex items-center justify-center gap-2"
                            >
                                {procesandoVenta ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Cobrar {business?.moneda === 'USD' ? '$' : business?.moneda} {total.toFixed(2)}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para editar stock */}
            {editingStockItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Ajustar Stock</h2>
                            <button onClick={() => setEditingStockItem(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <p className="text-slate-500 mb-2 text-sm">Estás editando el stock de:</p>
                        <h3 className="font-bold text-slate-900 text-lg mb-6">{editingStockItem.nombre}</h3>

                        <form onSubmit={handleUpdateStock}>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cantidad Disponible</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStockValue}
                                    onChange={(e) => setNewStockValue(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-bold text-lg"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={updatingStock}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-slate-300 disabled:text-slate-400 flex items-center justify-center gap-2"
                            >
                                {updatingStock ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Guardar Cambio
                                        <CheckCircle2 className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {mostrarTicket && (
                <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Venta Exitosa</h2>
                        <p className="text-slate-500 text-center mb-8">El pago se ha procesado correctamente.</p>

                        <div className="w-full bg-slate-50 rounded-2xl p-6 mb-8 space-y-3">
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>Ref: #{ultimaVenta?.id?.slice(0, 8)}</span>
                                <span>{new Date().toLocaleTimeString()}</span>
                            </div>
                            <div className="py-3 border-y border-slate-200 flex justify-between font-bold text-slate-900">
                                <span>Total Pagado</span>
                                <span className="text-blue-600">{business?.moneda === 'USD' ? '$' : business?.moneda} {ultimaVenta?.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium text-slate-700">
                                <span>Método</span>
                                <span className="capitalize">{ultimaVenta?.metodo_pago}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setMostrarTicket(false)}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Nueva Venta
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PaymentMethod = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${active
            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200'
            }`}
    >
        {icon}
        <span className="text-[10px] font-bold mt-1 uppercase">{label}</span>
    </button>
);

const CajeroLogin = ({ terminal, onLogin }) => {
    const [matricula, setMatricula] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { setEmployeeSession } = useStore();

    const handleMatriculaSubmit = async (e) => {
        if (e) e.preventDefault();
        if (matricula.length !== 6) return;

        setLoading(true);
        setError(null);
        try {
            // Usamos RPC seguro para validar PIN
            const { data: result, error: rpcError } = await supabase.rpc('validate_employee_pin', {
                p_matricula: matricula,
                p_id_sucursal: terminal.pos.id_sucursal
            });

            if (rpcError) throw rpcError;
            if (!result) throw new Error('Matrícula incorrecta o empleado no asignado a esta sucursal (debe ser de 6 dígitos).');

            const employee = result.user;
            const business = result.negocio;

            const employeeSession = {
                user: employee,
                negocio: business,
                role: employee.rol,
                id_sucursal: employee.id_sucursal,
                activatedAt: new Date().toISOString()
            };

            localStorage.setItem('employee_session', JSON.stringify(employeeSession));
            setEmployeeSession(employeeSession);
            onLogin(employee);
        } catch (err) {
            setError(err.message);
            setMatricula('');
        } finally {
            setLoading(false);
        }
    };

    const addDigit = (digit) => {
        if (matricula.length < 6) setMatricula(prev => prev + digit);
    };

    useEffect(() => {
        if (matricula.length === 6 && !loading) {
            const timer = setTimeout(() => handleMatriculaSubmit(), 300);
            return () => clearTimeout(timer);
        }
    }, [matricula]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-3xl mb-6 shadow-xl shadow-blue-500/20">
                        <Monitor className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{terminal.pos.nombre}</h1>
                    <p className="text-slate-400 font-medium">Sucursal: {terminal.pos.sucursales?.nombre}</p>
                </div>

                <div className="bg-white rounded-[40px] p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso de Cajero</h2>
                        <p className="text-slate-500 text-sm">Ingresa tu Matrícula para comenzar el turno</p>
                    </div>

                    <div className="flex justify-center gap-4 mb-10">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-all duration-300 ${matricula.length >= i ? 'bg-blue-600 scale-125' : 'bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => addDigit(num.toString())}
                                className="h-16 rounded-2xl bg-slate-50 text-2xl font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all outline-none"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={() => setMatricula('')}
                            className="h-16 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 active:scale-95 transition-all flex items-center justify-center outline-none"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => addDigit('0')}
                            className="h-16 rounded-2xl bg-slate-50 text-2xl font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all outline-none"
                        >
                            0
                        </button>
                        <button
                            onClick={() => setMatricula(prev => prev.slice(0, -1))}
                            className="h-16 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 active:scale-95 transition-all flex items-center justify-center outline-none"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    </div>

                    <button
                        onClick={handleMatriculaSubmit}
                        disabled={loading || matricula.length < 4}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Iniciar Turno
                                <LogIn className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POS;
