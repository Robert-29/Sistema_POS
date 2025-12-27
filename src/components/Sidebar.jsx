import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    ArrowLeftRight,
    Users,
    BarChart3,
    CreditCard,
    Building2,
    Settings,
    LogOut,
    Plus
} from 'lucide-react';

const Sidebar = ({ negocio }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
        { icon: <ShoppingCart size={20} />, label: 'Punto de Venta', path: '/pos' },
        { icon: <Package size={20} />, label: 'Productos', path: '/inventario' },
        { icon: <ArrowLeftRight size={20} />, label: 'Transacciones', path: '/transacciones' },
        { icon: <Users size={20} />, label: 'Personal', path: '/personal' },
        { icon: <Users size={20} />, label: 'Clientes', path: '/clientes' },
        { icon: <BarChart3 size={20} />, label: 'Reportes', path: '/reportes' },
        { icon: <CreditCard size={20} />, label: 'Pagos', path: '/pagos' },
    ];

    const bottomItems = [
        { icon: <Building2 size={20} />, label: 'Mi Empresa', path: '/dashboard' },
        { icon: <Settings size={20} />, label: 'Configuración', path: '/configuracion' },
    ];

    return (
        <div className="w-72 h-screen bg-[#0F172A] text-slate-400 flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50">
            {/* Logo */}
            <div className="p-8 pb-10 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                    <ShoppingCart size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-white font-bold text-xl tracking-tight">VentasPro</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{negocio?.nombre_negocio || 'Cargando...'}</p>
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium ${location.pathname === item.path
                            ? 'bg-white/5 text-white'
                            : 'hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 bg-slate-900/40 border-t border-slate-800/50 space-y-1">
                {bottomItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium ${location.pathname === item.path
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                    </Link>
                ))}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium text-red-400 hover:bg-red-500/10"
                >
                    <LogOut size={20} />
                    <span className="text-sm">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
