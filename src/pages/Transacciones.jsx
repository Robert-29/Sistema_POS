import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    ArrowLeftRight,
    Calendar,
    ChevronRight,
    CreditCard,
    Banknote,
    History,
    Search,
    Eye,
    Package
} from 'lucide-react';

const Transacciones = () => {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [negocio, setNegocio] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const savedPos = localStorage.getItem('pos_session');
            const savedEmployee = localStorage.getItem('employee_session');
            let idNegocio = user?.id;

            if (savedPos) {
                const parsed = JSON.parse(savedPos);
                idNegocio = parsed.id_negocio;
                setNegocio(parsed.negocio);
            } else if (savedEmployee) {
                const parsed = JSON.parse(savedEmployee);
                idNegocio = parsed.negocio.id;
                setNegocio(parsed.negocio);
            } else if (user) {
                const { data: perfil } = await supabase
                    .from('perfiles_negocio')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setNegocio(perfil);
            }

            if (idNegocio) {
                const { data: salesData, error } = await supabase
                    .from('ventas')
                    .select('*')
                    .eq('id_negocio', idNegocio)
                    .order('creado_en', { ascending: false });

                if (error) {
                    console.error('Error fetching sales:', error);
                } else {
                    setVentas(salesData || []);
                }
            }
        } catch (err) {
            console.error('Unexpected error in fetchInitialData:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetallesVenta = async (ventaId) => {
        const { data, error } = await supabase
            .from('detalles_ventas')
            .select(`
                *,
                productos:id_producto (nombre)
            `)
            .eq('id_venta', ventaId);

        if (error) console.error('Error fetching details:', error);
        return data || [];
    };

    const handleVerDetalles = async (venta) => {
        const detalles = await fetchDetallesVenta(venta.id);
        setVentaSeleccionada({ ...venta, detalles });
    };

    const filtrarVentas = ventas.filter(v =>
        v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.metodo_pago.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIconoMetodo = (metodo) => {
        switch (metodo) {
            case 'efectivo': return <Banknote className="w-5 h-5" />;
            case 'tarjeta': return <CreditCard className="w-5 h-5" />;
            default: return <ArrowLeftRight className="w-5 h-5" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <History className="w-8 h-8 text-blue-600" />
                            Transacciones
                        </h1>
                        <p className="text-slate-500 mt-1">Historial completo de tus ventas y movimientos.</p>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por ID o método de pago..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-sm font-bold uppercase tracking-wider">
                                    <th className="px-8 py-5">Fecha</th>
                                    <th className="px-6 py-5">Referencia</th>
                                    <th className="px-6 py-5">Método</th>
                                    <th className="px-6 py-5">Total</th>
                                    <th className="px-6 py-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filtrarVentas.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center">
                                                <History className="w-16 h-16 mb-4 opacity-10" />
                                                <p className="text-lg font-medium">No se encontraron transacciones</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtrarVentas.map((venta) => (
                                    <tr key={venta.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                                    <Calendar className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {new Date(venta.creado_en).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(venta.creado_en).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-slate-500 font-medium font-mono text-sm leading-none bg-slate-100 px-2 py-1 rounded">
                                                #{venta.id.slice(0, 8)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-600 font-medium capitalize">
                                                {getIconoMetodo(venta.metodo_pago)}
                                                {venta.metodo_pago}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-slate-900 underline decoration-blue-200 decoration-2 underline-offset-4">
                                                {negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {venta.total.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => handleVerDetalles(venta)}
                                                className="p-3 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Detalles */}
            {ventaSeleccionada && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Detalle de Venta</h2>
                                <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">#{ventaSeleccionada.id}</p>
                            </div>
                            <button onClick={() => setVentaSeleccionada(null)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <ChevronRight className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                {ventaSeleccionada.detalles.map((detalle, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <Package className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{detalle.productos?.nombre}</p>
                                                <p className="text-xs text-slate-400">{detalle.cantidad} x {negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {detalle.precio_unitario.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-slate-900">
                                            {negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium">Total de la Venta</p>
                                    <p className="text-xs text-slate-500 mt-1 capitalize">{ventaSeleccionada.metodo_pago} • {new Date(ventaSeleccionada.creado_en).toLocaleString()}</p>
                                </div>
                                <p className="text-3xl font-black text-blue-400">
                                    {negocio?.moneda === 'USD' ? '$' : negocio?.moneda} {ventaSeleccionada.total.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transacciones;
