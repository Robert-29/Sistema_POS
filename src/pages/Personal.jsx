import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    Store,
    Plus,
    Trash2,
    Edit2,
    Shield,
    UserPlus,
    Building2,
    Monitor
} from 'lucide-react';

import useStore from '../store/useStore';

const Personal = () => {
    const { business } = useStore();
    const [activeTab, setActiveTab] = useState('usuarios');
    const [usuarios, setUsuarios] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [puntosVenta, setPuntosVenta] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        nombre: '',
        username: '',
        email: '',
        password: '',
        rol: 'cajero', // Deprecated but kept for compatibility schema if needed
        permisos: {
            can_sell: true,
            can_view_stock: true,
            can_manage_products: false,
            can_view_reports: false
        },
        id_sucursal: '',
        matricula: '',
        // For POS
        nombre_pos: '',
        identificador: '',
        estado: 'activo'
    });

    useEffect(() => {
        if (business?.id) {
            fetchData();
        }
    }, [business]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, branchesData, posData] = await Promise.all([
                supabase.from('usuarios_sucursal').select('*, sucursales(nombre)').eq('id_negocio', business.id),
                supabase.from('sucursales').select('*').eq('id_negocio', business.id),
                supabase.from('puntos_venta').select('*, sucursales(nombre)').eq('id_negocio', business.id)
            ]);

            setUsuarios(usersData.data || []);
            setSucursales(branchesData.data || []);
            setPuntosVenta(posData.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'usuarios') {
                const data = {
                    id_negocio: business.id,
                    nombre: formData.nombre,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    rol: 'personal', // Default role for all employees now
                    permisos: formData.permisos,
                    id_sucursal: formData.id_sucursal || null,
                    matricula: formData.matricula
                };

                if (editingItem) {
                    await supabase.from('usuarios_sucursal').update(data).eq('id', editingItem.id);
                } else {
                    await supabase.from('usuarios_sucursal').insert([data]);
                }
            } else {
                const data = {
                    id_negocio: business.id,
                    nombre: formData.nombre_pos,
                    identificador: formData.identificador,
                    id_sucursal: formData.id_sucursal,
                    matricula: formData.matricula,
                    estado: formData.estado
                };

                if (editingItem) {
                    await supabase.from('puntos_venta').update(data).eq('id', editingItem.id);
                } else {
                    await supabase.from('puntos_venta').insert([data]);
                }
            }
            setShowModal(false);
            setEditingItem(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
        try {
            const table = activeTab === 'usuarios' ? 'usuarios_sucursal' : 'puntos_venta';
            await supabase.from(table).delete().eq('id', id);
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const resetForm = () => {
        const randomMatricula = Math.floor(100000 + Math.random() * 900000).toString();
        setFormData({
            nombre: '',
            username: '',
            email: '',
            password: '',
            rol: 'cajero',
            permisos: {
                can_sell: true,
                can_view_stock: true,
                can_manage_products: false,
                can_view_reports: false
            },
            id_sucursal: '',
            matricula: randomMatricula,
            nombre_pos: '',
            identificador: '',
            estado: 'activo'
        });
    };

    const openEdit = (item) => {
        setEditingItem(item);
        if (activeTab === 'usuarios') {
            setFormData({
                nombre: item.nombre,
                username: item.username,
                email: item.email || '',
                password: item.password,
                rol: item.rol,
                permisos: item.permisos || {
                    can_sell: true,
                    can_view_stock: true,
                    can_manage_products: false,
                    can_view_reports: false
                },
                id_sucursal: item.id_sucursal || '',
                matricula: item.matricula || item.pin_acceso || '',
                nombre_pos: '',
                estado: 'activo'
            });
        } else {
            setFormData({
                nombre: '',
                username: '',
                password: '',
                rol: 'cajero',
                permisos: {},
                id_sucursal: item.id_sucursal,
                nombre_pos: item.nombre,
                identificador: item.identificador || '',
                matricula: item.matricula || item.codigo_acceso || '',
                estado: item.estado
            });
        }
        setShowModal(true);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Personal y Puntos de Venta</h1>
                    <p className="text-slate-500 mt-1">Administra tu equipo y terminales de venta</p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} />
                    <span>Añadir {activeTab === 'usuarios' ? 'Usuario' : 'Punto de Venta'}</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('usuarios')}
                    className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'usuarios' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Users size={20} />
                        <span>Administrar Usuarios</span>
                    </div>
                    {activeTab === 'usuarios' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
                <button
                    onClick={() => setActiveTab('pos')}
                    className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'pos' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Monitor size={20} />
                        <span>Puntos de Venta</span>
                    </div>
                    {activeTab === 'pos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'usuarios' ? (
                        usuarios.map(user => (
                            <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                        <Users size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(user)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{user.nombre}</h3>
                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Shield size={16} />
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {user.permisos ? (
                                                <>
                                                    {user.permisos.can_sell && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">Ventas</span>}
                                                    {user.permisos.can_manage_products && <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">Productos</span>}
                                                    {user.permisos.can_view_stock && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">Stock</span>}
                                                    {user.permisos.can_view_reports && <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-bold">Reportes</span>}
                                                </>
                                            ) : (
                                                <span className="text-slate-900 font-medium capitalize">{user.rol}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Building2 size={16} />
                                        <span>Sucursal: <span className="text-slate-900 font-medium">{user.sucursales?.nombre || 'General'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Monitor size={16} />
                                        <span>Matrícula: <span className="text-blue-600 font-bold tracking-widest">{user.matricula || user.pin_acceso || 'Sin Matrícula'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">@{user.username}</span>
                                        {user.email && <span className="truncate max-w-[120px] bg-slate-100 px-2 py-1 rounded text-[10px] lowercase font-medium tracking-tight text-slate-500">{user.email}</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        puntosVenta.map(pos => (
                            <div key={pos.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                                        <Monitor size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(pos)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(pos.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{pos.nombre}</h3>
                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Building2 size={16} />
                                        <span>Sucursal: <span className="text-slate-900 font-medium">{pos.sucursales?.nombre}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Monitor size={16} />
                                        <span>Matrícula: <span className="text-blue-600 font-bold tracking-widest">{pos.matricula || pos.codigo_acceso || 'Sin Matrícula'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${pos.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {pos.estado}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Empty State */}
            {!loading && (activeTab === 'usuarios' ? usuarios.length === 0 : puntosVenta.length === 0) && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                        {activeTab === 'usuarios' ? <Users size={32} /> : <Monitor size={32} />}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No hay {activeTab === 'usuarios' ? 'usuarios' : 'puntos de venta'}</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">Comienza añadiendo uno usando el botón superior derecho.</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                {editingItem ? 'Editar' : 'Añadir'} {activeTab === 'usuarios' ? 'Usuario' : 'Punto de Venta'}
                            </h2>
                            <form onSubmit={handleSave} className="space-y-5">
                                {activeTab === 'usuarios' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Nombre Completo</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                placeholder="Ej. Juan Pérez"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Usuario</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    placeholder="jperez"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="juan@email.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 space-y-4">
                                                <h3 className="font-bold text-slate-700 text-sm">Permisos y Accesos</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                            checked={formData.permisos?.can_sell || false}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                permisos: { ...formData.permisos, can_sell: e.target.checked }
                                                            })}
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">Realizar Ventas</span>
                                                    </label>

                                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                            checked={formData.permisos?.can_manage_products || false}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                permisos: { ...formData.permisos, can_manage_products: e.target.checked }
                                                            })}
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">Gestionar Productos</span>
                                                    </label>

                                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                            checked={formData.permisos?.can_view_stock || false}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                permisos: { ...formData.permisos, can_view_stock: e.target.checked }
                                                            })}
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">Ver Inventario</span>
                                                    </label>

                                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                            checked={formData.permisos?.can_view_reports || false}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                permisos: { ...formData.permisos, can_view_reports: e.target.checked }
                                                            })}
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">Ver Reportes</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
                                                <input
                                                    type="password"
                                                    required={!editingItem}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-bold text-slate-700">Matrícula (6 dígitos)</label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const randomMatricula = Math.floor(100000 + Math.random() * 900000).toString();
                                                        setFormData(prev => ({ ...prev, matricula: randomMatricula }));
                                                    }}
                                                    className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                                                >
                                                    Generar Matrícula
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono text-center text-lg tracking-[0.5em]"
                                                value={formData.matricula}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    setFormData({ ...formData, matricula: val });
                                                }}
                                                placeholder="000000"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Punto de Venta</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                value={formData.nombre_pos}
                                                onChange={(e) => setFormData({ ...formData, nombre_pos: e.target.value })}
                                                placeholder="Ej. Caja Principal"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Identificador Único (para login)</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono"
                                                value={formData.identificador}
                                                onChange={(e) => setFormData({ ...formData, identificador: e.target.value })}
                                                placeholder="Ej. caja1_sucursalnorte"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-bold text-slate-700">Matrícula (Código de Acceso)</label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const randomMatricula = Math.floor(100000 + Math.random() * 900000).toString();
                                                        setFormData(prev => ({ ...prev, matricula: randomMatricula }));
                                                    }}
                                                    className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                                                >
                                                    Generar Matrícula
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                value={formData.matricula}
                                                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                                                placeholder="Ej. 123456"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Sucursal</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                        value={formData.id_sucursal}
                                        onChange={(e) => setFormData({ ...formData, id_sucursal: e.target.value })}
                                    >
                                        <option value="">Seleccionar sucursal</option>
                                        {sucursales.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Personal;
