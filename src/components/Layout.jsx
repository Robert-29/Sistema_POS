import React from 'react';
import Sidebar from './Sidebar';
import useStore from '../store/useStore';

const Layout = ({ children }) => {
    const { user, posSession, employeeSession } = useStore();

    if (!user && !posSession && !employeeSession) return children;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-72">
                {children}
            </main>
        </div>
    );
};

export default Layout;
