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

const Personal = ({ negocio }) => {
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
        password: '',
        rol: 'cajero',
        id_sucursal: '',
        // For POS
        nombre_pos: '',
        identificador: '',
        codigo_acceso: '',
        estado: 'activo'
    });

    useEffect(() => {
        if (negocio?.id) {
            fetchData();
        }
    }, [negocio]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, branchesData, posData] = await Promise.all([
                supabase.from('usuarios_sucursal').select('*, sucursales(nombre)').eq('id_negocio', negocio.id),
                supabase.from('sucursales').select('*').eq('id_negocio', negocio.id),
                supabase.from('puntos_venta').select('*, sucursales(nombre)').eq('id_negocio', negocio.id)
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
                    id_negocio: negocio.id,
                    nombre: formData.nombre,
                    username: formData.username,
                    password: formData.password,
                    rol: formData.rol,
                    id_sucursal: formData.id_sucursal || null
                };

                if (editingItem) {
                    await supabase.from('usuarios_sucursal').update(data).eq('id', editingItem.id);
                } else {
                    await supabase.from('usuarios_sucursal').insert([data]);
                }
            } else {
                const data = {
                    id_negocio: negocio.id,
                    nombre: formData.nombre_pos,
                    identificador: formData.identificador,
                    id_sucursal: formData.id_sucursal,
                    codigo_acceso: formData.codigo_acceso,
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
        setFormData({
            nombre: '',
            username: '',
            password: '',
            rol: 'cajero',
            id_sucursal: '',
            nombre_pos: '',
            identificador: '',
            codigo_acceso: '',
            estado: 'activo'
        });
    };

    const openEdit = (item) => {
        setEditingItem(item);
        if (activeTab === 'usuarios') {
            setFormData({
                nombre: item.nombre,
                username: item.username,
                password: item.password,
                rol: item.rol,
                id_sucursal: item.id_sucursal || '',
                nombre_pos: '',
                estado: 'activo'
            });
        } else {
            setFormData({
                nombre: '',
                username: '',
                password: '',
                rol: 'cajero',
                id_sucursal: item.id_sucursal,
                nombre_pos: item.nombre,
                identificador: item.identificador || '',
                codigo_acceso: item.codigo_acceso || '',
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
                                        <span>Rol: <span className="text-slate-900 font-medium capitalize">{user.rol}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Building2 size={16} />
                                        <span>Sucursal: <span className="text-slate-900 font-medium">{user.sucursales?.nombre || 'General'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">@{user.username}</span>
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
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Rol</label>
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                value={formData.rol}
                                                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                            >
                                                <option value="cajero">Cajero</option>
                                                <option value="supervisor">Supervisor</option>
                                                <option value="administrador">Administrador</option>
                                            </select>
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
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Código de Acceso (PIN)</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                value={formData.codigo_acceso}
                                                onChange={(e) => setFormData({ ...formData, codigo_acceso: e.target.value })}
                                                placeholder="Ej. 1234"
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
