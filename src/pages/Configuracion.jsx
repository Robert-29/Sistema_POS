import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Settings,
    Building2,
    MapPin,
    Phone,
    Globe,
    CreditCard,
    Save,
    Plus,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Clock
} from 'lucide-react';

import useStore from '../store/useStore';

const Configuracion = () => {
    const { business } = useStore();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [sucursales, setSucursales] = useState([]);

    // Form state for General settings
    const [perfil, setPerfil] = useState({
        nombre_negocio: business?.nombre_negocio || '',
        rfc: business?.rfc || '',
        direccion: business?.direccion || '',
        telefono: business?.telefono || '',
        email_contacto: business?.email_contacto || '',
        sitio_web: business?.sitio_web || '',
        moneda: business?.moneda || 'USD',
        tipo_inventario: business?.tipo_inventario || 'unico'
    });

    useEffect(() => {
        if (business) {
            setPerfil({
                nombre_negocio: business.nombre_negocio || '',
                rfc: business.rfc || '',
                direccion: business.direccion || '',
                telefono: business.telefono || '',
                email_contacto: business.email_contacto || '',
                sitio_web: business.sitio_web || '',
                moneda: business.moneda || 'USD',
                tipo_inventario: business.tipo_inventario || 'unico'
            });
        }
    }, [business]);

    // Form state for new branch
    const [nuevaSucursal, setNuevaSucursal] = useState({
        nombre: '',
        direccion: '',
        telefono: ''
    });

    useEffect(() => {
        if (activeTab === 'sucursales') {
            fetchSucursales();
        }
    }, [activeTab]);

    const fetchSucursales = async () => {
        if (!business) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('sucursales')
            .select('*')
            .eq('id_negocio', business.id)
            .order('creado_en', { ascending: true });

        if (error) console.error('Error fetching sucursales:', error);
        else setSucursales(data || []);
        setLoading(false);
    };

    const handleUpdatePerfil = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await supabase
            .from('perfiles_negocio')
            .update(perfil)
            .eq('id', business.id);

        if (error) {
            setMessage({ type: 'error', text: 'Error al actualizar el perfil: ' + error.message });
        } else {
            setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
        }
        setLoading(false);
    };

    const handleCrearSucursal = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase
            .from('sucursales')
            .insert([{ ...nuevaSucursal, id_negocio: business.id }]);

        if (error) {
            setMessage({ type: 'error', text: 'Error al crear sucursal: ' + error.message });
        } else {
            setNuevaSucursal({ nombre: '', direccion: '', telefono: '' });
            fetchSucursales();
            setMessage({ type: 'success', text: 'Sucursal creada correctamente.' });
        }
        setLoading(false);
    };

    const handleEliminarSucursal = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return;

        setLoading(true);
        const { error } = await supabase
            .from('sucursales')
            .delete()
            .eq('id', id);

        if (error) {
            setMessage({ type: 'error', text: 'Error al eliminar sucursal: ' + error.message });
        } else {
            fetchSucursales();
            setMessage({ type: 'success', text: 'Sucursal eliminada.' });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                        <Settings className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configuración</h1>
                        <p className="text-slate-500">Gestiona los detalles de tu empresa y sucursales.</p>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('sucursales')}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'sucursales' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        Sucursales
                    </button>
                </div>

                {activeTab === 'general' ? (
                    <form onSubmit={handleUpdatePerfil} className="space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                Datos del Negocio
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Nombre del Negocio</label>
                                    <input
                                        type="text"
                                        value={perfil.nombre_negocio}
                                        onChange={e => setPerfil({ ...perfil, nombre_negocio: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">RFC / Identificación Fiscal</label>
                                    <input
                                        type="text"
                                        value={perfil.rfc}
                                        onChange={e => setPerfil({ ...perfil, rfc: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-mono"
                                        placeholder="Opcional"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-slate-700">Dirección Principal</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={perfil.direccion}
                                            onChange={e => setPerfil({ ...perfil, direccion: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Teléfono</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={perfil.telefono}
                                            onChange={e => setPerfil({ ...perfil, telefono: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Email de Contacto</label>
                                    <input
                                        type="email"
                                        value={perfil.email_contacto}
                                        onChange={e => setPerfil({ ...perfil, email_contacto: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                                Preferencias del Sistema
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Moneda Habitual</label>
                                    <select
                                        value={perfil.moneda}
                                        onChange={e => setPerfil({ ...perfil, moneda: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-bold"
                                    >
                                        <option value="USD">USD - Dólar Estadounidense</option>
                                        <option value="MXN">MXN - Peso Mexicano</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="GTQ">GTQ - Quetzal</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        Tipo de Stock
                                        <Clock className="w-4 h-4 text-slate-400" />
                                    </label>
                                    <select
                                        value={perfil.tipo_inventario}
                                        onChange={e => setPerfil({ ...perfil, tipo_inventario: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-bold"
                                    >
                                        <option value="unico">Stock Global (Compartido)</option>
                                        <option value="sucursal">Stock por Sucursal (Independiente)</option>
                                    </select>
                                    <p className="text-[11px] text-slate-400 mt-1 italic">Cambia a "Stock por Sucursal" si deseas gestionar inventarios separados.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:bg-blue-300 flex items-center gap-3"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-600" />
                                Añadir Nueva Sucursal
                            </h2>
                            <form onSubmit={handleCrearSucursal} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Nombre de la Sucursal</label>
                                    <input
                                        type="text"
                                        value={nuevaSucursal.nombre}
                                        onChange={e => setNuevaSucursal({ ...nuevaSucursal, nombre: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                        required
                                        placeholder="Ej: Sucursal Norte"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={nuevaSucursal.telefono}
                                        onChange={e => setNuevaSucursal({ ...nuevaSucursal, telefono: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                        placeholder="Opcional"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-slate-700">Dirección</label>
                                    <input
                                        type="text"
                                        value={nuevaSucursal.direccion}
                                        onChange={e => setNuevaSucursal({ ...nuevaSucursal, direccion: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                        placeholder="Calle 123, Ciudad"
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Crear Sucursal
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Sucursales Existentes
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {sucursales.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">
                                        <p>No hay sucursales registradas aún.</p>
                                    </div>
                                ) : sucursales.map(sucursal => (
                                    <div key={sucursal.id} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{sucursal.nombre}</h3>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {sucursal.direccion || 'Sin dirección'}</span>
                                                    {sucursal.telefono && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {sucursal.telefono}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEliminarSucursal(sucursal.id)}
                                            className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Configuracion;
