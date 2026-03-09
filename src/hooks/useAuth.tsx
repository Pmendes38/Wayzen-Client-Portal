import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'consultant' | 'client';
  clientId: number | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileFromSession = async (session: Session | null) => {
      if (!session?.user?.email) {
        setUser(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, name, role, client_id')
        .eq('email', session.user.email)
        .eq('is_active', true)
        .single();

      if (error || !profile) {
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        clientId: profile.client_id,
      });
    };

    supabase.auth
      .getSession()
      .then(({ data }) => loadProfileFromSession(data.session))
      .finally(() => setLoading(false));

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        await loadProfileFromSession(session);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message || 'Falha na autenticação');
    }

    const loggedEmail = authData.user?.email;
    if (!loggedEmail) {
      throw new Error('Usuário autenticado sem email válido');
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role, client_id')
      .eq('email', loggedEmail)
      .eq('is_active', true)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      throw new Error('Usuário não autorizado no portal');
    }

    setUser({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      clientId: profile.client_id,
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
