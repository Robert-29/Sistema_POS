import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import {
    CreditCard,
    Truck,
    ShoppingCart,
    Receipt,
    Plus,
    Search,
    Building2,
    Calendar,
    DollarSign,
    MoreVertical,
    X,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

const Finanzas = () => {
    const { business } = useStore();
    const [tab, setTab] = useState('proveedores');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [error, setError] = useState('');

    // Listas adicionales para formularios
    const [productos, setProductos] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [listaProveedores, setListaProveedores] = useState([]);

    // ... (logic in fetchAuxData will update this)

    // Form states - Proveedores
    const [nombreProv, setNombreProv] = useState('');
    const [contactoProv, setContactoProv] = useState('');

    // Form states - Compras
    const [compraProv, setCompraProv] = useState('');
    const [compraProd, setCompraProd] = useState('');
    const [compraSucursal, setCompraSucursal] = useState('');
    const [compraCant, setCompraCant] = useState('');
    const [compraCosto, setCompraCosto] = useState('');

    // Form states - Gastos
    const [gastoConcepto, setGastoConcepto] = useState('');
    const [gastoMonto, setGastoMonto] = useState('');
    const [gastoCat, setGastoCat] = useState('Servicios');

    useEffect(() => {
        if (business) {
            fetchData();
            if (tab === 'compras') {
                fetchAuxData();
            }
        }
    }, [business, tab]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            if (tab === 'proveedores') {
                const { data: provs } = await supabase.from('proveedores').select('*').eq('id_negocio', business.id);
                setData(provs || []);
            } else if (tab === 'compras') {
                const { data: comps } = await supabase.from('compras').select('*, proveedores(nombre)').eq('id_negocio', business.id);
                setData(comps || []);
            } else if (tab === 'gastos') {
                const { data: gts } = await supabase.from('gastos').select('*').eq('id_negocio', business.id);
                setData(gts || []);
            }
        } catch (err) {
            console.error(err);
            setError('Error al cargar datos principales.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAuxData = async () => {
        try {
            const { data: ps } = await supabase.from('productos').select('id, nombre').eq('id_negocio', business.id);
            setProductos(ps || []);

            if (business.tipo_inventario !== 'unico') {
                const { data: ss } = await supabase.from('sucursales').select('id, nombre').eq('id_negocio', business.id);
                setSucursales(ss || []);
            }

            const { data: provs } = await supabase.from('proveedores').select('id, nombre').eq('id_negocio', business.id);
            setListaProveedores(provs || []);
        } catch (err) {
            console.error('Error fetching aux data:', err);
        }
    };

    const handleGuardarProveedor = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { error: insErr } = await supabase.from('proveedores').insert([{
                nombre: nombreProv,
                contacto: contactoProv,
                id_negocio: business.id
            }]);
            if (insErr) throw insErr;
            limpiarFormularios();
            setMostrarModal(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarCompra = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const cant = parseInt(compraCant);
            const costo = parseFloat(compraCosto);

            if (!compraProv || !compraProd || isNaN(cant) || isNaN(costo)) {
                throw new Error('Por favor completa todos los campos obligatorios.');
            }

            // 1. Registrar compra
            const { data: newCompra, error: cErr } = await supabase.from('compras').insert([{
                id_negocio: business.id,
                id_proveedor: compraProv,
                total: costo,
                estado: 'completado'
            }]).select().single();
            if (cErr) throw cErr;

            // 2. Aumentar stock
            if (business.tipo_inventario === 'unico') {
                const { data: prod } = await supabase.from('productos').select('stock').eq('id', compraProd).single();
                await supabase.from('productos').update({ stock: (prod?.stock || 0) + cant }).eq('id', compraProd);
            } else {
                if (!compraSucursal) throw new Error('Selecciona una sucursal para el inventario.');
                const { data: sStock } = await supabase.from('stock_sucursales').select('cantidad').eq('id_producto', compraProd).eq('id_sucursal', compraSucursal).maybeSingle();
                await supabase.from('stock_sucursales').upsert({
                    id_producto: compraProd,
                    id_sucursal: compraSucursal,
                    id_negocio: business.id,
                    cantidad: (sStock?.cantidad || 0) + cant
                }, { onConflict: 'id_producto,id_sucursal' });
            }

            // 3. Registrar auditoria
            await supabase.from('logs_auditoria').insert([{
                id_negocio: business.id,
                accion: 'COMPRA_REGISTRADA',
                detalles: `Compra de ${cant} unidades de prod ${compraProd}. Total: ${costo}`
            }]);

            limpiarFormularios();
            setMostrarModal(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarGasto = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { error: insErr } = await supabase.from('gastos').insert([{
                id_negocio: business.id,
                concepto: gastoConcepto,
                monto: parseFloat(gastoMonto),
                categoria: gastoCat
            }]);
            if (insErr) throw insErr;

            limpiarFormularios();
            setMostrarModal(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const limpiarFormularios = () => {
        setNombreProv('');
        setContactoProv('');
        setCompraProv('');
        setCompraProd('');
        setCompraSucursal('');
        setCompraCant('');
        setCompraCosto('');
        setGastoConcepto('');
        setGastoMonto('');
        setGastoCat('Servicios');
        setError('');
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <CreditCard className="w-8 h-8 text-blue-600" />
                            Gestión Financiera
                        </h1>
                        <p className="text-slate-500 mt-1">Controla tus compras, gastos y proveedores en un solo lugar.</p>
                    </div>
                    <button
                        onClick={() => setMostrarModal(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        {tab === 'proveedores' ? 'Nuevo Proveedor' : (tab === 'compras' ? 'Registrar Compra' : 'Registrar Gasto')}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/50 p-1.5 rounded-2xl border border-slate-200 mb-8 max-w-md">
                    <button
                        onClick={() => setTab('proveedores')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'proveedores' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Truck className="w-4 h-4" />
                        Proveedores
                    </button>
                    <button
                        onClick={() => setTab('compras')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'compras' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Compras
                    </button>
                    <button
                        onClick={() => setTab('gastos')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'gastos' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Receipt className="w-4 h-4" />
                        Gastos
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="p-20 text-center text-slate-400">
                            <div className="flex flex-col items-center">
                                {tab === 'proveedores' ? <Truck className="w-16 h-16 mb-4 opacity-10" /> : (tab === 'compras' ? <ShoppingCart className="w-16 h-16 mb-4 opacity-10" /> : <Receipt className="w-16 h-16 mb-4 opacity-10" />)}
                                <p className="text-lg font-medium">No hay registros en {tab}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="px-8 py-5">Nombre / Concepto</th>
                                        <th className="px-6 py-5">Info Adicional</th>
                                        <th className="px-6 py-5">Fecha</th>
                                        {tab !== 'proveedores' && <th className="px-6 py-5">Monto</th>}
                                        <th className="px-6 py-5 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-5">
                                                <span className="font-bold text-slate-900">{item.nombre || item.concepto || 'Sin nombre'}</span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500">
                                                {tab === 'proveedores' ? item.contacto : (tab === 'compras' ? `Proveedor: ${item.proveedores?.nombre}` : item.categoria)}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500">
                                                {new Date(item.creado_en || item.fecha).toLocaleDateString()}
                                            </td>
                                            {tab !== 'proveedores' && (
                                                <td className="px-6 py-5">
                                                    <span className="font-bold text-slate-900">${(item.total || item.monto).toFixed(2)}</span>
                                                </td>
                                            )}
                                            <td className="px-6 py-5 text-right">
                                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-all">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Unificado */}
            {mostrarModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center text-blue-600 bg-blue-50/50">
                            <h2 className="text-2xl font-bold">
                                {tab === 'proveedores' ? 'Nuevo Proveedor' : (tab === 'compras' ? 'Nueva Compra' : 'Nuevo Gasto')}
                            </h2>
                            <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2 mb-6">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            {tab === 'proveedores' && (
                                <form onSubmit={handleGuardarProveedor} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre Comercial</label>
                                        <input
                                            className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                                            placeholder="Suministros Globales"
                                            value={nombreProv}
                                            onChange={(e) => setNombreProv(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Contacto</label>
                                        <input
                                            className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                                            placeholder="Teléfono o Email"
                                            value={contactoProv}
                                            onChange={(e) => setContactoProv(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Guardar Proveedor'}
                                    </button>
                                </form>
                            )}

                            {tab === 'compras' && (
                                <form onSubmit={handleGuardarCompra} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Producto</label>
                                        <select className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl outline-none" value={compraProd} onChange={(e) => setCompraProd(e.target.value)} required>
                                            <option value="">Selección...</option>
                                            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Proveedor</label>
                                            <select className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl outline-none" value={compraProv} onChange={(e) => setCompraProv(e.target.value)} required>
                                                <option value="">Selección...</option>
                                                {listaProveedores.map(pr => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
                                            </select>
                                        </div>
                                        {business.tipo_inventario !== 'unico' && (
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Sucursal</label>
                                                <select className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl outline-none" value={compraSucursal} onChange={(e) => setCompraSucursal(e.target.value)} required>
                                                    <option value="">Selección...</option>
                                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Cantidad</label>
                                            <input type="number" className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl outline-none" value={compraCant} onChange={(e) => setCompraCant(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Costo Total ($)</label>
                                            <input type="number" step="0.01" className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl outline-none" value={compraCosto} onChange={(e) => setCompraCosto(e.target.value)} required />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Registrar Compra'}
                                    </button>
                                </form>
                            )}

                            {tab === 'gastos' && (
                                <form onSubmit={handleGuardarGasto} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Concepto</label>
                                        <input className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl outline-none" placeholder="Pago de Renta" value={gastoConcepto} onChange={(e) => setGastoConcepto(e.target.value)} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Monto ($)</label>
                                            <input type="number" step="0.01" className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl outline-none" value={gastoMonto} onChange={(e) => setGastoMonto(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Categoría</label>
                                            <select className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl outline-none" value={gastoCat} onChange={(e) => setGastoCat(e.target.value)}>
                                                <option>Servicios</option>
                                                <option>Renta</option>
                                                <option>Publicidad</option>
                                                <option>Otros</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Registrar Gasto'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finanzas;
