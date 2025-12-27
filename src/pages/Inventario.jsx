import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import {
    Package,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit3,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    X
} from 'lucide-react';

const Inventario = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);

    // Form state
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [codigoBarras, setCodigoBarras] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProductos();
    }, []);

    const fetchProductos = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('id_negocio', user.id)
            .order('creado_en', { ascending: false });

        if (error) console.error('Error fetching productos:', error);
        else setProductos(data || []);
        setLoading(false);
    };

    const handleCrearProducto = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error: insertError } = await supabase
                .from('productos')
                .insert([{
                    nombre,
                    precio: parseFloat(precio),
                    stock: parseInt(stock),
                    codigo_barras: codigoBarras,
                    id_negocio: user.id
                }]);

            if (insertError) throw insertError;

            // Reset form and refresh
            setNombre('');
            setPrecio('');
            setStock('');
            setCodigoBarras('');
            setMostrarModal(false);
            fetchProductos();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filtrarProductos = productos.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigo_barras && p.codigo_barras.includes(searchTerm))
    );

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Package className="w-8 h-8 text-blue-600" />
                            Inventario
                        </h1>
                        <p className="text-slate-500 mt-1">Gestiona tus productos, precios y niveles de stock.</p>
                    </div>
                    <button
                        onClick={() => setMostrarModal(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Añadir Producto
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-semibold hover:bg-slate-50 transition-all">
                        <Filter className="w-5 h-5" />
                        Filtros
                    </button>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-sm font-bold uppercase tracking-wider">
                                    <th className="px-8 py-5">Producto</th>
                                    <th className="px-6 py-5">Código</th>
                                    <th className="px-6 py-5">Precio</th>
                                    <th className="px-6 py-5">Stock</th>
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
                                ) : filtrarProductos.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center">
                                                <Package className="w-16 h-16 mb-4 opacity-10" />
                                                <p className="text-lg font-medium">No se encontraron productos</p>
                                                <p className="text-sm">Empieza añadiendo tu primer artículo al inventario.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtrarProductos.map((producto) => (
                                    <tr key={producto.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <span className="font-bold text-slate-900">{producto.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-slate-500 font-medium font-mono text-sm">{producto.codigo_barras || '---'}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-slate-900">${producto.precio.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${producto.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                    {producto.stock} uds.
                                                </span>
                                                {producto.stock <= 5 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-white hover:text-blue-600 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 hover:bg-white hover:text-red-600 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Producto */}
            {mostrarModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-900">Añadir Producto</h2>
                            <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCrearProducto} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Producto</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                    placeholder="Ej: Camiseta de Algodón"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Precio ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={precio}
                                        onChange={(e) => setPrecio(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-mono"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Stock Inicial</label>
                                    <input
                                        type="number"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-mono"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Código de Barras (Opcional)</label>
                                <input
                                    type="text"
                                    value={codigoBarras}
                                    onChange={(e) => setCodigoBarras(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-mono"
                                    placeholder="Scanea o escribe el código"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setMostrarModal(false)}
                                    className="flex-1 py-4 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-2 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:bg-blue-300 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Guardar Producto
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventario;
