import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Layout from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import POS from './pages/POS';
import Configuracion from './pages/Configuracion';
import Personal from './pages/Personal';

function App() {
  const [session, setSession] = useState(null);
  const [negocio, setNegocio] = useState(null);
  const [posSession, setPosSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for normal session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchNegocio(session.user.id, session.user.email);
      else checkPosSession();
    });

    // 2. Check for POS session
    const checkPosSession = () => {
      const savedPos = localStorage.getItem('pos_session');
      if (savedPos) {
        const parsed = JSON.parse(savedPos);
        setPosSession(parsed);
        setNegocio(parsed.negocio);
      }
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchNegocio(session.user.id, session.user.email);
      else {
        setNegocio(null);
        checkPosSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchNegocio = async (userId, userEmail) => {
    const { data } = await supabase
      .from('perfiles_negocio')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      // Sync owner email if it's missing or different
      if (userEmail && data.email_propietario !== userEmail) {
        await supabase
          .from('perfiles_negocio')
          .update({ email_propietario: userEmail })
          .eq('id', userId);
        data.email_propietario = userEmail;
      }
      setNegocio(data);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <BrowserRouter>
      <Layout session={session} negocio={negocio} posSession={posSession}>
        {!session && !posSession && <Navbar session={session} />}
        <Routes>
          <Route path="/" element={(!session && !posSession) ? <Home /> : <Navigate to="/dashboard" />} />
          <Route path="/auth" element={(!session && !posSession) ? <Auth /> : <Navigate to="/dashboard" />} />
          <Route path="/onboarding" element={session ? (negocio ? <Navigate to="/dashboard" /> : <Onboarding />) : <Navigate to="/auth" />} />

          <Route path="/dashboard" element={(session || posSession) ? (negocio ? <Dashboard negocio={negocio} posSession={posSession} /> : <Navigate to="/onboarding" />) : <Navigate to="/auth" />} />
          <Route path="/inventario" element={(session || posSession) ? <Inventario /> : <Navigate to="/auth" />} />
          <Route path="/pos" element={(session || posSession) ? <POS /> : <Navigate to="/auth" />} />
          <Route path="/configuracion" element={session ? <Configuracion negocio={negocio} /> : <Navigate to="/auth" />} />
          <Route path="/personal" element={session ? <Personal negocio={negocio} /> : <Navigate to="/auth" />} />
          <Route path="/transacciones" element={(session || posSession) ? <div className="p-8">Historial de Ventas (Próximamente)</div> : <Navigate to="/auth" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;