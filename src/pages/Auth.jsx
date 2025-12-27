import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { User, Mail, Lock, Eye, EyeOff, LogIn, Github } from 'lucide-react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();


    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
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
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Registrarse
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
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder="tu@email.com"
                                required
                            />
                        </div>
                    </div>

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
                        {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default Auth;
