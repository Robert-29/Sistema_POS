import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Package,
    Plus,
    Search,
    Filter,
    AlertTriangle,
    Edit3,
    Trash2,
    X,
    CheckCircle2
} from 'lucide-react';
import useStore from '../store/useStore';

const Inventario = () => {
    const { business, user, employeeSession, posSession } = useStore();
    const [productos, setProductos] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);

    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [codigoBarras, setCodigoBarras] = useState('');
    const [stockPorSucursal, setStockPorSucursal] = useState({}); // { sucursalId: cantidad }

    const [editandoId, setEditandoId] = useState(null);
    const [error, setError] = useState(null);
    const [sucursalFiltro, setSucursalFiltro] = useState('todas');

    useEffect(() => {
        if (business) {
            fetchProductos();
            fetchSucursales();
        }
    }, [business]);

    const fetchSucursales = async () => {
        const { data } = await supabase
            .from('sucursales')
            .select('*')
            .eq('id_negocio', business.id);
        setSucursales(data || []);
    };

    const fetchProductos = async () => {
        setLoading(true);
        try {
            const idNegocio = business.id;

            // Buscamos productos y sus stocks por sucursal si aplica
            const { data, error } = await supabase
                .from('productos')
                .select(`
                    *,
                    stock_sucursales(id_sucursal, cantidad)
                `)
                .eq('id_negocio', idNegocio)
                .order('creado_en', { ascending: false });

            if (error) {
                setError(error.message);
            } else {
                let processedData = data || [];

                // Si es empleado y el inventario es por sucursal, filtrar SOLO productos de su sucursal
                if (employeeSession && business.tipo_inventario !== 'unico') {
                    processedData = processedData.filter(p => {
                        return p.stock_sucursales?.some(s => s.id_sucursal === employeeSession.id_sucursal);
                    });
                }

                setProductos(processedData);
            }
        } catch (err) {
            console.error('Unexpected error in fetchProductos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarProducto = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const payload = {
                nombre,
                precio: parseFloat(precio),
                stock: business.tipo_inventario === 'unico' ? parseInt(stock) : 0,
                codigo_barras: codigoBarras,
                id_negocio: business.id
            };

            // LOGICA PARA EMPLEADOS (USANDO RPC)
            if (employeeSession) {
                // Si es empleado, usamos el input 'stock' para su sucursal actual
                // independientemente de si es inventario único o por sucursal.
                // Si es unico, el RPC lo manejará via 'stock' column.
                // Si es por sucursal, lo mandamos en p_stock_sucursales.

                let stockSucursalesArray = null;

                if (business.tipo_inventario !== 'unico') {
                    stockSucursalesArray = [{
                        id_sucursal: employeeSession.id_sucursal,
                        cantidad: parseInt(stock || 0)
                    }];
                }

                const rpcPayload = {
                    p_employee_id: employeeSession.user.id,
                    p_product_data: editandoId ? { ...payload, id: editandoId } : { ...payload, stock: parseInt(stock || 0) },
                    p_stock_sucursales: stockSucursalesArray,
                    p_operation: editandoId ? 'UPDATE' : 'INSERT'
                };

                const { error: rpcError } = await supabase.rpc('manage_product', rpcPayload);
                if (rpcError) throw rpcError;

            } else {
                // LOGICA ORIGINAL PARA DUEÑOS (DIRECTO A TABLA)
                let productId = editandoId;

                if (editandoId) {
                    const { error: updateError } = await supabase
                        .from('productos')
                        .update(payload)
                        .eq('id', editandoId);
                    if (updateError) throw updateError;
                } else {
                    const { data: newProd, error: insertError } = await supabase
                        .from('productos')
                        .insert([payload])
                        .select()
                        .single();
                    if (insertError) throw insertError;
                    productId = newProd.id;
                }

                // Stocks para Dueño
                if (business.tipo_inventario !== 'unico') {
                    const stockEntries = sucursales.map(sucursal => ({
                        id_producto: productId,
                        id_sucursal: sucursal.id,
                        id_negocio: business.id,
                        cantidad: parseInt(stockPorSucursal[sucursal.id] || 0)
                    }));

                    const { error: stockError } = await supabase
                        .from('stock_sucursales')
                        .upsert(stockEntries, { onConflict: 'id_producto,id_sucursal' });
                    if (stockError) throw stockError;
                }
            }

            // Reset form and refresh
            limpiarFormulario();
            setMostrarModal(false);
            fetchProductos();
        } catch (err) {
            console.error(err);
            setError('Error al guardar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditar = (producto) => {
        setEditandoId(producto.id);
        setNombre(producto.nombre);
        setPrecio(producto.precio.toString());
        setStock(producto.stock.toString());
        setCodigoBarras(producto.codigo_barras || '');

        // Cargar stocks por sucursal
        if (producto.stock_sucursales) {
            const stocks = {};
            producto.stock_sucursales.forEach(s => {
                stocks[s.id_sucursal] = s.cantidad;
            });
            setStockPorSucursal(stocks);
        } else {
            setStockPorSucursal({});
        }

        setMostrarModal(true);
    };

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

        try {
            const { error } = await supabase
                .from('productos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchProductos();
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        }
    };

    const limpiarFormulario = () => {
        setNombre('');
        setPrecio('');
        setStock('');
        setCodigoBarras('');
        setStockPorSucursal({});
        setEditandoId(null);
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
                        <p className="text-slate-500 mt-1">Gestiona tus productos, niveles de stock y precios.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Selector de Sucursal para Administradores */}
                        {!(posSession || employeeSession) && (
                            <div className="relative min-w-[200px]">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <select
                                    value={sucursalFiltro}
                                    onChange={(e) => setSucursalFiltro(e.target.value)}
                                    className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all outline-none appearance-none font-bold text-slate-700 shadow-sm"
                                >
                                    <option value="todas">📍 Todas las sucursales</option>
                                    {sucursales.length > 0 ? (
                                        sucursales.map(s => (
                                            <option key={s.id} value={s.id}>🏢 {s.nombre}</option>
                                        ))
                                    ) : (
                                        <option disabled>No hay sucursales creadas</option>
                                    )}
                                </select>
                            </div>
                        )}

                        {/* Mostrar botón si es Dueño (no employeeSession) o si tiene permiso */}
                        {(!employeeSession || (employeeSession.permisos && employeeSession.permisos.can_manage_products)) && (
                            <button
                                onClick={() => {
                                    limpiarFormulario();
                                    setMostrarModal(true);
                                }}
                                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Añadir Producto
                            </button>
                        )}
                    </div>
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
                                    <th className="px-6 py-5">
                                        {business?.tipo_inventario === 'unico' ? 'Stock Global' : 'Stock por Sucursales'}
                                    </th>
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
                                            {sucursalFiltro === 'todas' ? (
                                                business?.tipo_inventario === 'unico' ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${producto.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {producto.stock} uds.
                                                        </span>
                                                        {producto.stock <= 5 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                                    </div>
                                                ) : (

                                                    // VISUALIZACIÓN DE STOCK (Depende de si es Admin o Empleado)
                                                    employeeSession ? (
                                                        // Vista para EMPLEADO: Solo mostrar su sucursal
                                                        (() => {
                                                            const s = (producto.stock_sucursales || []).find(st => st.id_sucursal === employeeSession.id_sucursal);
                                                            const cant = s ? s.cantidad : 0;
                                                            return (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">En Mi Sucursal</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-sm font-bold ${cant <= 5 ? 'text-red-600' : 'text-slate-700'}`}>
                                                                            {cant} uds.
                                                                        </span>
                                                                        {cant <= 5 && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()
                                                    ) : (
                                                        // Vista para MANAGER/DUEÑO: Mostrar todas
                                                        <div className="flex flex-wrap gap-2">
                                                            {(producto.stock_sucursales || []).map((s, idx) => {
                                                                const suc = sucursales.find(sucursal => sucursal.id === s.id_sucursal);
                                                                return (
                                                                    <div key={idx} className="flex flex-col">
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{suc?.nombre || 'Sucursal'}</span>
                                                                        <span className={`text-xs font-bold ${s.cantidad <= 5 ? 'text-red-600' : 'text-slate-700'}`}>
                                                                            {s.cantidad} uds.
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )
                                                )
                                            ) : (
                                                (() => {
                                                    const s = (producto.stock_sucursales || []).find(st => st.id_sucursal === sucursalFiltro);
                                                    const stockVal = business?.tipo_inventario === 'unico' ? producto.stock : (s ? s.cantidad : 0);
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${stockVal <= 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                {stockVal} uds.
                                                            </span>
                                                            {stockVal <= 5 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {(!employeeSession || (employeeSession.permisos && employeeSession.permisos.can_manage_products)) && (
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditar(producto)}
                                                        className="p-2 hover:bg-white hover:text-blue-600 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                                    >
                                                        <Edit3 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminar(producto.id)}
                                                        className="p-2 hover:bg-white hover:text-red-600 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
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
                            <h2 className="text-2xl font-bold text-slate-900">{editandoId ? 'Editar Producto' : 'Añadir Producto'}</h2>
                            <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleGuardarProducto} className="p-8 space-y-6">
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

                                {/* Mostrar Input de Stock:
                                    1. Si es inventario UNICO (Global) -> Stock simple.
                                    2. Si es inventario POR SUCURSAL y es EMPLEADO -> Stock de SU sucursal.
                                */}
                                {(business?.tipo_inventario === 'unico' || employeeSession) && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            {employeeSession ? `Stock en Mi Sucursal` : 'Stock Inicial'}
                                        </label>
                                        <input
                                            type="number"
                                            value={stock}
                                            onChange={(e) => setStock(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-mono"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Mostrar lista de sucursales SOLO si es Dueño (no employeeSession) y NO es único */}
                            {business?.tipo_inventario !== 'unico' && !employeeSession && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-700">Stock por Sucursal</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {sucursales.map(sucursal => (
                                            <div key={sucursal.id} className="p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
                                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">{sucursal.nombre}</p>
                                                <input
                                                    type="number"
                                                    value={stockPorSucursal[sucursal.id] || ''}
                                                    onChange={(e) => setStockPorSucursal({
                                                        ...stockPorSucursal,
                                                        [sucursal.id]: e.target.value
                                                    })}
                                                    className="w-full bg-white px-3 py-2 border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-mono text-sm"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
