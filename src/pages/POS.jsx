import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
    Package
} from 'lucide-react';

const POS = () => {
    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [procesandoVenta, setProcesandoVenta] = useState(false);
    const [mostrarTicket, setMostrarTicket] = useState(false);
    const [ultimaVenta, setUltimaVenta] = useState(null);
    const [negocio, setNegocio] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { data: perfil } = await supabase
            .from('perfiles_negocio')
            .select('*')
            .eq('id', user.id)
            .single();
        setNegocio(perfil);

        const { data } = await supabase
            .from('productos')
            .select('*')
            .eq('id_negocio', user.id)
            .gt('stock', 0);

        setProductos(data || []);
        setLoading(false);
    };

    const agregarAlCarrito = (producto) => {
        setCarrito(prev => {
            const existente = prev.find(item => item.id === producto.id);
            if (existente) {
                if (existente.cantidad >= producto.stock) return prev;
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
                if (nuevaCantidad > 0 && nuevaCantidad <= (productoOriginal?.stock || 0)) {
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
            const { data: { user } } = await supabase.auth.getUser();

            const { data: venta, error: ventaError } = await supabase
                .from('ventas')
                .insert([{
                    id_negocio: user.id,
                    total: total,
                    metodo_pago: metodoPago,
                    vendedor_id: user.id
                }])
                .select()
                .single();

            if (ventaError) throw ventaError;

            const detalles = carrito.map(item => ({
                id_venta: venta.id,
                id_producto: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio
            }));

            const { error: detallesError } = await supabase
                .from('detalles_ventas')
                .insert(detalles);

            if (detallesError) throw detallesError;

            for (const item of carrito) {
                await supabase
                    .from('productos')
                    .update({ stock: item.stock - item.cantidad })
                    .eq('id', item.id);
            }

            setUltimaVenta({ ...venta, items: carrito });
            setCarrito([]);
            setMostrarTicket(true);
            fetchInitialData();
        } catch (err) {
            alert('Error al procesar la venta: ' + err.message);
        } finally {
            setProcesandoVenta(false);
        }
    };

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigo_barras && p.codigo_barras.includes(searchTerm))
    );

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <ShoppingCart className="w-7 h-7 text-blue-600" />
                            Punto de Venta
                        </h1>
                        <span className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                            {productos.length} Productos disponibles
                        </span>
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
                                <button
                                    key={producto.id}
                                    onClick={() => agregarAlCarrito(producto)}
                                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all text-left flex flex-col group active:scale-95"
                                >
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <Package className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{producto.nombre}</h3>
                                    <div className="mt-auto pt-4 flex justify-between items-end">
                                        <span className="text-xl font-bold text-blue-600">
                                            {negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {producto.precio.toFixed(2)}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${producto.stock < 10 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'
                                            }`}>
                                            Stock: {producto.stock}
                                        </span>
                                    </div>
                                </button>
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
                                            <p className="text-blue-600 font-bold text-xs">{negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {item.precio.toFixed(2)}</p>
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
                                    <span>{negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {(total * 0.85).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-500 font-medium pb-4 border-b border-slate-200/50">
                                    <span>Impuestos (15%)</span>
                                    <span>{negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {(total * 0.15).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold text-slate-900">Total</span>
                                    <span className="text-3xl font-extrabold text-blue-600">{negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {total.toFixed(2)}</span>
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
                                        Cobrar {negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {total.toFixed(2)}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
                                <span className="text-blue-600">{negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {ultimaVenta?.total.toFixed(2)}</span>
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

export default POS;
