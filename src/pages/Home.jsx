import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <main className="pt-32 pb-20 px-4">

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center">

        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="whitespace-nowrap">
              La solución para tu negocio
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight mb-6 tracking-tight">
          Gestiona tu negocio de forma{" "}
          <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-blue-400">
            inteligente
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
          VentasPro es el sistema de punto de venta todo-en-uno que te ayuda a vender más, gestionar inventario y hacer crecer tu negocio.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">

          <Link to="/auth" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-500/20 cursor-pointer">
            Crear mi Cuenta Gratis
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>


        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600 font-medium">
          {["Rápido", "7 días de prueba gratis", "Cancela cuando quieras"].map((text, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* Features Heading */}
      <section className="mt-40 text-center">
        <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Todo lo que necesitas para tu negocio
        </h2>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Herramientas poderosas diseñadas para ayudarte a vender más y gestionar mejor tu inventario y ventas.
        </p>
      </section>

    </main>
  );
};

export default Home;