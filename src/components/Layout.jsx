import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, session, negocio, posSession }) => {
    if (!session && !posSession) return children;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar negocio={negocio} posSession={posSession} />
            <main className="flex-1 ml-72">
                {children}
            </main>
        </div>
    );
};

export default Layout;
