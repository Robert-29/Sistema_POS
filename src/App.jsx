import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Transacciones from './pages/Transacciones';
import Traslados from './pages/Traslados';
import Finanzas from './pages/Finanzas';
import Reportes from './pages/Reportes';

import useStore from './store/useStore';

function App() {
  const {
    user,
    business,
    employeeSession,
    posSession,
    loading,
    initialized,
    initialize
  } = useStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  if (loading || !initialized) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <BrowserRouter>
      <Layout>
        {!user && !posSession && !employeeSession && <Navbar />}
        <Routes>
          <Route path="/" element={(!user && !posSession && !employeeSession) ? <Home /> : <Navigate to="/dashboard" />} />
          <Route path="/auth" element={(!user && !posSession && !employeeSession) ? <Auth /> : <Navigate to="/dashboard" />} />
          <Route path="/onboarding" element={user ? (business ? <Navigate to="/dashboard" /> : <Onboarding />) : <Navigate to="/auth" />} />

          <Route path="/dashboard" element={(user || posSession || employeeSession) ? (business ? <Dashboard /> : <Navigate to="/onboarding" />) : <Navigate to="/auth" />} />
          <Route path="/inventario" element={(user || posSession || employeeSession) ? <Inventario /> : <Navigate to="/auth" />} />
          <Route path="/pos" element={(user || posSession || employeeSession) ? <POS /> : <Navigate to="/auth" />} />
          <Route path="/configuracion" element={user ? <Configuracion /> : <Navigate to="/auth" />} />
          <Route path="/personal" element={(user || (employeeSession && employeeSession.role === 'administrador')) ? <Personal /> : <Navigate to="/auth" />} />
          <Route path="/transacciones" element={(user || posSession || employeeSession) ? <Transacciones /> : <Navigate to="/auth" />} />
          <Route path="/traslados" element={(user || (employeeSession && employeeSession.role === 'supervisor')) ? <Traslados /> : <Navigate to="/auth" />} />
          <Route path="/finanzas" element={user ? <Finanzas /> : <Navigate to="/auth" />} />
          <Route path="/reportes" element={(user || (employeeSession && employeeSession.role === 'administrador')) ? <Reportes /> : <Navigate to="/auth" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;