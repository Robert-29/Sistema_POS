import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, User } from 'lucide-react';

const Navbar = ({ session }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-xl">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-slate-900">POSify</span>
                    </Link>


                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Dashboard</Link>
                        <Link to="/inventario" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Inventario</Link>
                        <Link to="/pos" className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-blue-600 font-bold">Vender</Link>
                    </div>



                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {session ? (
                            <>
                                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg text-slate-700 font-medium whitespace-nowrap">
                                    <User className="w-4 h-4" />
                                    <span className="text-sm hidden sm:inline">{session.user.email}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors font-medium px-4 py-2 cursor-pointer whitespace-nowrap"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="hidden sm:inline">Salir</span>
                                </button>
                            </>
                        ) : (

                            <>
                                <Link to="/auth" className="text-slate-600 hover:text-blue-600 transition-colors font-medium px-4 py-2 cursor-pointer">Iniciar Sesión</Link>
                                <Link to="/auth" className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 flex items-center gap-2">
                                    Comenzar Gratis
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>

    );
};

export default Navbar;
