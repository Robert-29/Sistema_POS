import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    BarChart3,
    TrendingUp,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Download,
    Filter
} from 'lucide-react';
import useStore from '../store/useStore';

const Reportes = () => {
    const { business } = useStore();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        ventasHoy: 0,
        transaccionesHoy: 0,
        promedioVenta: 0,
        crecimiento: 0
    });

    useEffect(() => {
        if (business) {
            fetchStats();
        }
    }, [business]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: salesToday } = await supabase
                .from('ventas')
                .select('total')
                .eq('id_negocio', business.id)
                .gte('creado_en', today.toISOString());

            const total = salesToday?.reduce((acc, curr) => acc + curr.total, 0) || 0;
            const count = salesToday?.length || 0;

            setStats({
                ventasHoy: total,
                transaccionesHoy: count,
                promedioVenta: count > 0 ? total / count : 0,
                crecimiento: 12.5 // Mock for now
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                            Reportes y Estadísticas
                        </h1>
                        <p className="text-slate-500 mt-1">Monitorea el rendimiento de tu negocio en tiempo real.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all">
                            <Calendar className="w-5 h-5" />
                            Hoy
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                            <Download className="w-5 h-5" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Ventas de Hoy"
                        value={`${business?.moneda === 'USD' ? '$' : business?.moneda} ${stats.ventasHoy.toFixed(2)}`}
                        icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                        trend="+15.3%"
                        trendUp={true}
                    />
                    <StatCard
                        title="Transacciones"
                        value={stats.transaccionesHoy}
                        icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
                        trend="+8%"
                        trendUp={true}
                    />
                    <StatCard
                        title="Promedio de Venta"
                        value={`${business?.moneda === 'USD' ? '$' : business?.moneda} ${stats.promedioVenta.toFixed(2)}`}
                        icon={<BarChart3 className="w-6 h-6 text-indigo-600" />}
                        trend="-2.4%"
                        trendUp={false}
                    />
                    <StatCard
                        title="Crecimiento Mensual"
                        value={`${stats.crecimiento}%`}
                        icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
                        trend="+12%"
                        trendUp={true}
                    />
                </div>

                {/* Placeholder for Graphs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-[400px] flex flex-col items-center justify-center text-slate-400">
                        <BarChart3 className="w-16 h-16 mb-4 opacity-10" />
                        <p className="text-lg font-medium">Gráfico de Ventas</p>
                        <p className="text-sm">Próximamente: Visualización detallada por horas y días.</p>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-[400px] flex flex-col items-center justify-center text-slate-400">
                        <Filter className="w-16 h-16 mb-4 opacity-10" />
                        <p className="text-lg font-medium">Top Productos</p>
                        <p className="text-sm">Próximamente: Los artículos más vendidos.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, trend, trendUp }) => (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-2xl">
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </div>
            )}
        </div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
);

export default Reportes;
