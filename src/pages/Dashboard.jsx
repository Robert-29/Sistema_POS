import React, { useState, useEffect } from 'react';
import { Edit3, Building2, Plus, X, Save, MapPin, Phone, Mail, Link as LinkIcon, FileText, CheckCircle2 } from 'lucide-react';
import useStore from '../store/useStore';

const Dashboard = () => {
    const { business, user, posSession, employeeSession, initialize } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (business) {
            setFormData(business);
        }
    }, [business]);

    const getRemainingDays = () => {
        if (!business?.actualizado_stock_en) return 0;
        const lastUpdate = new Date(business.actualizado_stock_en);
        const now = new Date();
        const diffTime = Math.abs(now - lastUpdate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, 60 - diffDays);
    };

    const remainingDays = getRemainingDays();
    const canChangeStock = remainingDays <= 0;

    const handleSave = async () => {
        setLoading(true);
        try {
            const updates = {
                nombre_negocio: formData.nombre_negocio,
                rfc: formData.rfc,
                direccion: formData.direccion,
                telefono: formData.telefono,
                email_contacto: formData.email_contacto,
                sitio_web: formData.sitio_web,
                region: formData.region,
                moneda: formData.moneda,
                tipo_inventario: formData.tipo_inventario
            };

            // Solo actualizar la fecha si el tipo de stock realmente cambió
            if (formData.tipo_inventario !== business.tipo_inventario) {
                if (!canChangeStock) {
                    throw new Error(`Debes esperar ${remainingDays} días más para cambiar el tipo de stock.`);
                }
                updates.actualizado_stock_en = new Date().toISOString();
            }

            const { error } = await supabase
                .from('perfiles_negocio')
                .update(updates)
                .eq('id', business.id);

            if (error) throw error;

            await initialize(); // Refrescamos el estado global
            setIsEditing(false);
        } catch (error) {
            console.error('Error al actualizar:', error);
            alert(error.message || 'Error al actualizar los datos');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData(business);
        setIsEditing(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!business || !formData) return null;

    return (
        <div className="p-8 lg:p-12">
            {/* Profile Section */}
            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm mb-10">
                {/* Banner */}
                <div className="h-44 bg-linear-to-r from-blue-500 to-indigo-600 relative">
                    <button className="absolute bottom-6 right-8 bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition-all">
                        <Edit3 size={16} />
                        Editar Banner
                    </button>
                </div>
                {/* Info Bar */}
                <div className="px-10 pb-8 relative">
                    <div className="absolute -top-16 left-10 w-32 h-32 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-white">
                        <Building2 size={64} className="text-blue-600" />
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 p-1.5 rounded-xl text-white border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                            <Plus size={16} />
                        </div>
                    </div>

                    <div className="pt-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex-1">
                            {isEditing ? (
                                <input
                                    name="nombre_negocio"
                                    value={formData.nombre_negocio}
                                    onChange={handleChange}
                                    className="text-3xl font-extrabold text-slate-900 bg-slate-50 border-b-2 border-blue-600 outline-none w-full max-md"
                                />
                            ) : (
                                <h2 className="text-3xl font-extrabold text-slate-900">{business?.nombre_negocio}</h2>
                            )}
                            <p className="text-slate-500 font-medium flex items-center gap-2 mt-1 uppercase tracking-wider text-xs">
                                RFC: <span className="text-slate-900 font-bold">{business?.rfc || 'No registrado'}</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                                    >
                                        <X size={18} />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-sm"
                                    >
                                        <Save size={18} />
                                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-sm"
                                >
                                    <Edit3 size={18} />
                                    Editar Perfil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div >

            {/* Cards Grid */}
            < div className="grid grid-cols-1 gap-8" >

                {/* Contact Information */}
                < div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm h-full flex flex-col" >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-900">Información de la Empresa</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-12 flex-1">
                        <ContactItem
                            icon={<MapPin />}
                            label="Dirección"
                            name="direccion"
                            value={business?.direccion}
                            isEditing={isEditing}
                            formData={formData}
                            onChange={handleChange}
                        />
                        <ContactItem
                            icon={<Phone />}
                            label="Teléfono"
                            name="telefono"
                            value={business?.telefono}
                            isEditing={isEditing}
                            formData={formData}
                            onChange={handleChange}
                        />
                        <ContactItem
                            icon={<Mail />}
                            label="Correo Electrónico"
                            name="email_contacto"
                            value={business?.email_contacto}
                            isEditing={isEditing}
                            formData={formData}
                            onChange={handleChange}
                        />
                        <ContactItem
                            icon={<LinkIcon />}
                            label="Sitio Web"
                            name="sitio_web"
                            value={business?.sitio_web}
                            isEditing={isEditing}
                            formData={formData}
                            onChange={handleChange}
                        />
                        <ContactItem
                            icon={<FileText />}
                            label="RFC"
                            name="rfc"
                            value={business?.rfc}
                            isEditing={isEditing}
                            formData={formData}
                            onChange={handleChange}
                        />
                        <ContactItem
                            icon={<Building2 />}
                            label="Región"
                            name="region"
                            value={business?.region}
                            isEditing={isEditing}
                            formData={formData}
                            onChange={handleChange}
                        />
                        <ContactItem
                            icon={<Plus />}
                            label="Moneda"
                            name="moneda"
                            value={business?.moneda}
                            isEditing={isEditing}
                            formData={formData}
                            onChange={handleChange}
                        />
                        <ContactItem
                            icon={<CheckCircle2 />}
                            label="Tipo de Stock"
                            name="tipo_inventario"
                            value={business?.tipo_inventario}
                            isEditing={isEditing}
                            formData={formData}
                            onChange={handleChange}
                            isSelect={true}
                            canChangeStock={canChangeStock}
                            remainingDays={remainingDays}
                        />
                    </div>
                </div >
            </div >
        </div >
    );
};

const ContactItem = ({ icon, label, value, isEditing, formData, onChange, name, isSelect, canChangeStock, remainingDays }) => (
    <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">{label}</p>
            {isEditing ? (
                isSelect && name === 'tipo_inventario' ? (
                    <div className="space-y-1">
                        <select
                            name={name}
                            value={formData[name] || ''}
                            onChange={onChange}
                            disabled={!canChangeStock}
                            className={`w-full bg-slate-50 border-b-2 outline-none text-slate-900 font-bold text-[15px] py-1 ${!canChangeStock ? 'border-slate-200 opacity-50 cursor-not-allowed' : 'border-blue-600'}`}
                        >
                            <option value="unico">Stock Global (Compartido)</option>
                            <option value="sucursal">Stock por Sucursal (Independiente)</option>
                        </select>
                        {!canChangeStock && (
                            <p className="text-[10px] text-red-500 font-bold">Podrás cambiarlo en {remainingDays} días</p>
                        )}
                    </div>
                ) : (
                    <input
                        name={name}
                        value={formData[name] || ''}
                        onChange={onChange}
                        className="w-full bg-slate-50 border-b-2 border-blue-600 outline-none text-slate-900 font-bold text-[15px] py-1"
                    />
                )
            ) : (
                <p className="text-slate-900 font-bold text-[15px] truncate">
                    {name === 'tipo_inventario'
                        ? (value === 'unico' ? 'Stock Global' : 'Stock por Sucursal')
                        : (value || 'No disponible')}
                </p>
            )}
        </div>
    </div>
);

const SubItem = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="text-slate-900 font-bold">{value}</span>
    </div>
);

export default Dashboard;
