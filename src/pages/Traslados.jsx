import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import {
    ArrowLeftRight,
    Plus,
    Search,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Building2,
    Package,
    ChevronRight,
    X
} from 'lucide-react';

const Traslados = () => {
    const { business } = useStore();
    const [traslados, setTraslados] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarModal, setMostrarModal] = useState(false);

    // Form state
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');
    const [productoSeleccionado, setProductoSeleccionado] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (business) {
            fetchData();
        }
    }, [business]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Sucursales
            const { data: sucData } = await supabase
                .from('sucursales')
                .select('*')
                .eq('id_negocio', business.id);
            setSucursales(sucData || []);

            // Fetch Productos
            const { data: prodData } = await supabase
                .from('productos')
                .select('*, stock_sucursales(*)')
                .eq('id_negocio', business.id);
            setProductos(prodData || []);

            // Fetch Traslados (Mocking or creating table if needed, for now we assume a table 'traslados' exists or we just show the history)
            // Since I didn't create a 'traslados' table in the migration, I should probably create it or just implement the logic.
            // Let's assume we want to track these moves.
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTraslado = async (e) => {
        e.preventDefault();
        setError('');

        if (origen === destino) {
            setError('La sucursal de origen y destino no pueden ser la misma.');
            return;
        }

        const cant = parseInt(cantidad);
        if (isNaN(cant) || cant <= 0) {
            setError('Ingresa una cantidad válida.');
            return;
        }

        setLoading(true);
        try {
            // 1. Verificar stock en origen
            const { data: stockOrigen, error: stockErr } = await supabase
                .from('stock_sucursales')
                .select('cantidad')
                .eq('id_producto', productoSeleccionado)
                .eq('id_sucursal', origen)
                .single();

            if (stockErr || !stockOrigen || stockOrigen.cantidad < cant) {
                throw new Error('Stock insuficiente en la sucursal de origen.');
            }

            // 2. Restar de origen
            const { error: decError } = await supabase
                .from('stock_sucursales')
                .update({ cantidad: stockOrigen.cantidad - cant })
                .eq('id_producto', productoSeleccionado)
                .eq('id_sucursal', origen);
            if (decError) throw decError;

            // 3. Sumar a destino (upsert)
            const { data: stockDestino } = await supabase
                .from('stock_sucursales')
                .select('cantidad')
                .eq('id_producto', productoSeleccionado)
                .eq('id_sucursal', destino)
                .maybeSingle();

            const nuevaCantDestino = (stockDestino?.cantidad || 0) + cant;

            const { error: incError } = await supabase
                .from('stock_sucursales')
                .upsert({
                    id_producto: productoSeleccionado,
                    id_sucursal: destino,
                    id_negocio: business.id,
                    cantidad: nuevaCantDestino
                }, { onConflict: 'id_producto,id_sucursal' });
            if (incError) throw incError;

            // 4. Registrar en Auditoria
            await supabase.from('logs_auditoria').insert([{
                id_negocio: business.id,
                accion: 'TRASLADO_STOCK',
                detalles: `Traslado de ${cant} units de producto ${productoSeleccionado} desde ${origen} hacia ${destino}`
            }]);

            setMostrarModal(false);
            fetchData();
            alert('Traslado completado con éxito.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <ArrowLeftRight className="w-8 h-8 text-blue-600" />
                            Traslados de Mercancía
                        </h1>
                        <p className="text-slate-500 mt-1">Mueve stock entre tus sucursales de forma controlada.</p>
                    </div>
                    <button
                        onClick={() => setMostrarModal(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Traslado
                    </button>
                </div>

                {/* Dashboard stats / History overview could go here */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center text-slate-400">
                    <Building2 className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p className="text-lg font-medium">Historial de Traslados</p>
                    <p className="text-sm">Próximamente: Lista detallada de movimientos históricos.</p>
                </div>
            </div>

            {/* Modal de Traslado */}
            {mostrarModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center text-blue-600 bg-blue-50/50">
                            <h2 className="text-2xl font-bold">Configurar Traslado</h2>
                            <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleTraslado} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Producto a Mover</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                                    value={productoSeleccionado}
                                    onChange={(e) => setProductoSeleccionado(e.target.value)}
                                    required
                                >
                                    <option value="">Selecciona un producto...</option>
                                    {productos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} (ID: {p.id.substring(0, 5)})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Origen</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                                        value={origen}
                                        onChange={(e) => setOrigen(e.target.value)}
                                        required
                                    >
                                        <option value="">Desde...</option>
                                        {sucursales.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Destino</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                                        value={destino}
                                        onChange={(e) => setDestino(e.target.value)}
                                        required
                                    >
                                        <option value="">Hacia...</option>
                                        {sucursales.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cantidad a Trasladar</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all outline-none font-mono"
                                    placeholder="0"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <ArrowLeftRight className="w-5 h-5" />
                                        Ejecutar Traslado
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Traslados;
