import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { User, Mail, Lock, Eye, EyeOff, LogIn, Github } from 'lucide-react';

const Auth = () => {
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
    const [showPassword, setShowPassword] = useState(false);
    const [identifier, setIdentifier] = useState(''); // Unified field for email/user/terminal
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();


    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (authMode === 'login') {
                const cleanIdentifier = identifier.trim();

                // 1. INTENTAR LOGIN DE PERSONAL (Empleados)
                const { data: empData, error: empRpcError } = await supabase.rpc('login_employee', {
                    p_identifier: cleanIdentifier,
                    p_password: password
                });

                if (empData) {
                    const employeeSession = {
                        user: empData.employee,
                        negocio: empData.negocio,
                        role: empData.employee.rol,
                        activatedAt: new Date().toISOString()
                    };
                    localStorage.setItem('employee_session', JSON.stringify(employeeSession));
                    window.location.href = '/dashboard';
                    return;
                }

                // 2. INTENTAR LOGIN DE TERMINAL (Punto de Venta)
                const { data: posData, error: posRpcError } = await supabase.rpc('login_pos', {
                    p_identificador: cleanIdentifier,
                    p_matricula: password
                });

                if (posData) {
                    const posSession = {
                        pos: posData.pos,
                        negocio: posData.negocio,
                        activatedAt: new Date().toISOString()
                    };
                    localStorage.setItem('pos_session', JSON.stringify(posSession));
                    window.location.href = '/pos';
                    return;
                }

                // 3. INTENTAR LOGIN DE ADMINISTRADOR (Supabase Auth)
                // Solo intentamos si parece un formato de email válido
                if (cleanIdentifier.includes('@')) {
                    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                        email: cleanIdentifier,
                        password: password
                    });

                    if (!authError && authData.user) {
                        const { data: profile } = await supabase
                            .from('perfiles_negocio')
                            .select('id')
                            .eq('user_id', authData.user.id)
                            .maybeSingle();

                        if (profile) window.location.href = '/dashboard';
                        else window.location.href = '/onboarding';
                        return;
                    }
                }

                throw new Error('No se encontró ninguna cuenta con estas credenciales o la contraseña es incorrecta.');
            } else {
                // ... signup logic
                const { data, error } = await supabase.auth.signUp({
                    email: identifier,
                    password: password,
                    options: {
                        emailRedirectTo: window.location.origin + '/auth'
                    }
                });
                if (error) throw error;

                if (data?.user && data?.session === null) {
                    alert('¡Registro casi completo! Revisa tu correo electrónico para confirmar tu cuenta.');
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
                {/* Login Selection */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                    <button
                        onClick={() => setAuthMode('login')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Acceso General
                    </button>
                    <button
                        onClick={() => setAuthMode('signup')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${authMode === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                            {authMode === 'signup' ? 'Email' : 'Usuario, Email o Terminal'}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type={authMode === 'signup' ? 'email' : 'text'}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder={authMode === 'signup' ? 'tu@email.com' : 'Ej. admin@test.com o cajero01'}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {authMode === 'signup' ? 'Contraseña' : 'Contraseña o Matrícula'}
                        </label>
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
                        {authMode === 'login' ? 'Entrar al Sistema' : 'Crear Cuenta'}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default Auth;
