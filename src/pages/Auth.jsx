import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { User, Mail, Lock, Eye, EyeOff, LogIn, Github } from 'lucide-react';

const Auth = () => {
    const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'terminal'
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [terminalCode, setTerminalCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();


    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (authMode === 'terminal') {
                // 1. Find the POS with the identifier and code
                const { data: pos, error: pError } = await supabase
                    .from('puntos_venta')
                    .select('*, sucursales(nombre)')
                    .eq('identificador', email) // 'email' field in form is now used for 'identificador'
                    .eq('codigo_acceso', terminalCode)
                    .eq('estado', 'activo')
                    .maybeSingle();

                if (!pos) throw new Error('Identificador o Código de acceso incorrecto.');

                // 2. Get the business details
                const { data: business, error: bError } = await supabase
                    .from('perfiles_negocio')
                    .select('id, nombre_negocio')
                    .eq('id', pos.id_negocio)
                    .maybeSingle();

                if (!business) throw new Error('No se encontró el negocio asociado a esta terminal.');

                // 3. Save session to localStorage
                const posSession = {
                    pos: pos,
                    negocio: business,
                    activatedAt: new Date().toISOString()
                };
                localStorage.setItem('pos_session', JSON.stringify(posSession));

                // Trigger a page reload to update App state
                window.location.href = '/pos';
                return;
            }

            if (authMode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                // Check if user has a profile
                const { data: profile } = await supabase
                    .from('perfiles_negocio')
                    .select('id')
                    .eq('id', data.user.id)
                    .single();


                if (profile) {
                    navigate('/');
                } else {
                    navigate('/onboarding');
                }
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin + '/auth'
                    }
                });
                if (error) throw error;

                if (data?.user && data?.session === null) {
                    alert('¡Registro casi completo! Por favor, revisa tu correo electrónico (Gmail) para confirmar tu cuenta y poder iniciar sesión.');
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center bg-slate-50">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">

                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-4">
                        <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">POSify</h1>
                    <p className="text-slate-500 font-medium">Gestiona tu negocio de forma inteligente</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                    <button
                        onClick={() => setAuthMode('login')}
                        className={`flex-1 py-2.5 text-[12px] font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Admin Login
                    </button>
                    <button
                        onClick={() => setAuthMode('terminal')}
                        className={`flex-1 py-2.5 text-[12px] font-bold rounded-lg transition-all ${authMode === 'terminal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Modo Terminal
                    </button>
                    <button
                        onClick={() => setAuthMode('signup')}
                        className={`flex-1 py-2.5 text-[12px] font-bold rounded-lg transition-all ${authMode === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Registro
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleAuth} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {authMode === 'terminal' ? 'Identificador de Terminal' : 'Email'}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type={authMode === 'terminal' ? 'text' : 'email'}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder={authMode === 'terminal' ? 'caja01_norte' : 'tu@email.com'}
                                required
                            />
                        </div>
                    </div>

                    {authMode !== 'terminal' ? (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-slate-900 placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Código de Acceso de Terminal</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={terminalCode}
                                    onChange={(e) => setTerminalCode(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-slate-900 placeholder:text-slate-400"
                                    placeholder="Ej. 1234"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <LogIn className="w-5 h-5" />
                        )}
                        {authMode === 'terminal' ? 'Activar Terminal' : (authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default Auth;
