import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useStore = create((set, get) => ({
    // ESTADO
    user: null,
    business: null,
    employeeSession: null,
    posSession: null,
    loading: true,
    initialized: false,

    // ACCIONES
    initialize: async () => {
        set({ loading: true });
        try {
            // 1. Verificar sesión de administrador
            const { data: { session } } = await supabase.auth.getSession();
            let adminUser = session?.user || null;
            let business = null;

            if (adminUser) {
                const { data: profile } = await supabase
                    .from('perfiles_negocio')
                    .select('*')
                    .eq('user_id', adminUser.id)
                    .maybeSingle();
                business = profile;
            }

            // 2. Verificar sesión de empleado
            const savedEmployee = localStorage.getItem('employee_session');
            const employeeSession = savedEmployee ? JSON.parse(savedEmployee) : null;

            // 3. Verificar sesión de terminal (POS)
            const savedPos = localStorage.getItem('pos_session');
            const posSession = savedPos ? JSON.parse(savedPos) : null;

            set({
                user: adminUser,
                business: business || employeeSession?.negocio || posSession?.negocio,
                employeeSession,
                posSession,
                loading: false,
                initialized: true
            });
        } catch (error) {
            console.error('Error al inicializar store:', error);
            set({ loading: false, initialized: true });
        }
    },

    clearSessions: () => {
        localStorage.removeItem('employee_session');
        localStorage.removeItem('pos_session');
        supabase.auth.signOut();
        set({ user: null, business: null, employeeSession: null, posSession: null });
    },

    setBusiness: (business) => set({ business }),
    setEmployeeSession: (session) => set({ employeeSession: session, business: session?.negocio }),
    setPosSession: (session) => set({ posSession: session, business: session?.negocio }),
}));

export default useStore;
