import React from 'react';

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-xl">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-dark-blue">VentasPro</span>
                    </div>

                    {/* Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#" className="text-gray-text hover:text-primary transition-colors font-medium">Características</a>
                        <a href="#" className="text-gray-text hover:text-primary transition-colors font-medium">Precios</a>
                        <a href="#" className="text-gray-text hover:text-primary transition-colors font-medium">Contacto</a>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button className="text-gray-text hover:text-primary transition-colors font-medium px-4 py-2 cursor-pointer">Iniciar Sesión</button>
                        <button className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 flex items-center gap-2">
                            Comenzar Gratis
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

    );
};

export default Navbar;
