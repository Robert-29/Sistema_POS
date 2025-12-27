import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, Globe, Package, ArrowRight, DollarSign, MapPin, Phone, Mail, Link as LinkIcon, FileText } from 'lucide-react';

const Onboarding = () => {
    const [nombreNegocio, setNombreNegocio] = useState('');
    const [region, setRegion] = useState('');
    const [tipoInventario, setTipoInventario] = useState('compartido'); // Usando 'compartido' como valor por defecto para tipo_inventario
    const [moneda, setMoneda] = useState('MXN');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hoverInfo, setHoverInfo] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('No se encontró sesión de usuario');

            const { error: profileError } = await supabase
                .from('perfiles_negocio')
                .insert([
                    {
                        id: user.id,
                        nombre_negocio: nombreNegocio,
                        region,
                        tipo_inventario: tipoInventario, // Se guarda como stock compartido o único
                        moneda,
                    }
                ]);

            if (profileError) throw profileError;

            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center bg-slate-50">
            <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 p-12 border border-slate-100 relative overflow-hidden">

                {/* Header Section */}
                <div className="mb-10 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-blue-600 p-4 rounded-[24px] shadow-xl shadow-blue-500/20">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Configura tu Negocio
                    </h1>
                    <p className="text-lg text-slate-500">
                        Solo unos detalles rápidos para comenzar con tu punto de venta.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Nombre de empresa" icon={<Building2 />} value={nombreNegocio} onChange={setNombreNegocio} placeholder="Ej: Café Delight" required />
                            <InputField label="Región / País" icon={<Globe />} value={region} onChange={setRegion} placeholder="Ej: México" required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Moneda</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <select
                                        value={moneda}
                                        onChange={(e) => setMoneda(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-slate-900 appearance-none font-medium"
                                    >
                                        <option value="USD">USD - Dólar Estadounidense</option>
                                        <option value="MXN">MXN - Peso Mexicano</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="BRL">BRL - Real Brasileño</option>
                                        <option value="COP">COP - Peso Colombiano</option>
                                    </select>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="flex items-center gap-2 mb-3">
                                    <label className="block text-sm font-bold text-slate-700">Tipo de stock</label>
                                    <div
                                        className="relative group cursor-help"
                                        onMouseEnter={() => setHoverInfo(true)}
                                        onMouseLeave={() => setHoverInfo(false)}
                                    >
                                        <Globe className="w-4 h-4 text-blue-500" />
                                        {hoverInfo && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-slate-900 text-white text-xs rounded-2xl shadow-xl z-10 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="space-y-2">
                                                    <p><span className="font-bold text-blue-400">Stock compartido:</span> El inventario se sincroniza automáticamente entre todas tus tiendas o sucursales.</p>
                                                    <p><span className="font-bold text-emerald-400">Stock único:</span> Cada sucursal gestiona su propio inventario de forma independiente.</p>
                                                </div>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Package className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <select
                                        value={tipoInventario}
                                        onChange={(e) => setTipoInventario(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-slate-900 appearance-none font-medium"
                                    >
                                        <option value="compartido">Stock compartido</option>
                                        <option value="unico">Stock único por sucursal</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-5 rounded-[24px] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group mt-4 active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Comenzar ahora
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InputField = ({ label, icon, value, onChange, placeholder, type = "text", required = false }) => (
    <div>
        <label className="block text-sm font-bold text-slate-700 mb-3">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                {React.cloneElement(icon, { className: "w-5 h-5" })}
            </div>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder={placeholder}
                required={required}
            />
        </div>
    </div>
);

export default Onboarding;
