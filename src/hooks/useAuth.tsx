import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

const LOCK_ERROR_PATTERN = /lock broken by another request|acquiring lock/i;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

function isAuthTimeoutError(message?: string) {
  return !!message && /tempo de autenticacao excedido|authentication timeout|timed out/i.test(message);
}

async function loginViaRest(email: string, password: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error_description || payload?.msg || 'Falha na autenticação');
    }

    const accessToken = payload?.access_token as string | undefined;
    const refreshToken = payload?.refresh_token as string | undefined;
    if (!accessToken || !refreshToken) {
      throw new Error('Resposta de autenticação inválida do Supabase.');
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Tempo de autenticacao excedido. Verifique sua conexao e tente novamente.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function isTransientLockError(message?: string) {
  return !!message && LOCK_ERROR_PATTERN.test(message.toLowerCase());
}

async function resolveProfileBySession(session: Session) {
  const authId = session.user.id;
  const email = session.user.email;

  let profileQuery = await supabase
    .from('users')
    .select('id, email, name, role, client_id')
    .eq('auth_user_id', authId)
    .eq('is_active', true)
    .maybeSingle();

  if (!profileQuery.data && email) {
    profileQuery = await supabase
      .from('users')
      .select('id, email, name, role, client_id')
      .eq('email', email)
      .eq('is_active', true)
      .single();
  }

  return profileQuery;
}

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
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    const loadProfileFromSession = async (session: Session | null) => {
      if (!session?.user?.email) {
        setUser(null);
        return;
      }

      const { data: profile, error } = await resolveProfileBySession(session);

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

    // Fail-safe para evitar spinner infinito em cenarios de lock/concorrencia do Auth.
    const loadingTimeout = window.setTimeout(() => {
      if (!disposed) {
        setLoading(false);
      }
    }, 6000);

    const bootstrapSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        await loadProfileFromSession(data.session);
      } catch {
        setUser(null);
      } finally {
        if (!disposed) {
          setLoading(false);
        }
        window.clearTimeout(loadingTimeout);
      }
    };

    bootstrapSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        // Evita deadlocks de lock interno do Supabase Auth ao executar queries no callback.
        window.setTimeout(() => {
          loadProfileFromSession(session).catch(() => {
            setUser(null);
          });
        }, 0);
      }
    );

    return () => {
      disposed = true;
      window.clearTimeout(loadingTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    let authData: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data'] | null = null;

    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000,
        'Tempo de autenticacao excedido. Verifique a conexao e tente novamente.'
      );

      if (result.error) {
        if (isTransientLockError(result.error.message)) {
          await sleep(300);
          await loginViaRest(email, password);
          const [{ data: userData }, { data: sessionData }] = await Promise.all([
            supabase.auth.getUser(),
            supabase.auth.getSession(),
          ]);
          authData = {
            user: userData.user,
            session: sessionData.session,
          } as any;
        } else {
          throw new Error(result.error.message || 'Falha na autenticação');
        }
      } else {
        authData = result.data;
      }
    } catch (error: any) {
      if (isAuthTimeoutError(error?.message) || isTransientLockError(error?.message)) {
        await loginViaRest(email, password);
        const [{ data: userData }, { data: sessionData }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession(),
        ]);
        authData = {
          user: userData.user,
          session: sessionData.session,
        } as any;
      } else {
        throw error;
      }
    }

    if (!authData) {
      throw new Error('Falha na autenticação');
    }

    const loggedEmail = authData.user?.email;
    if (!loggedEmail) {
      throw new Error('Usuário autenticado sem email válido');
    }

    const currentSession = await withTimeout(
      supabase.auth.getSession(),
      8000,
      'Tempo de autenticacao excedido ao recuperar sessao.'
    );
    const session = currentSession.data.session;
    if (!session) {
      throw new Error('Nao foi possivel recuperar a sessao apos login.');
    }

    const { data: profile, error: profileError } = await resolveProfileBySession(session);

    if (profileError || !profile) {
      await supabase.auth.signOut();
      throw new Error('Usuário não autorizado no portal');
    }

    // Garante o fluxo login -> escolha de portal para perfis internos.
    localStorage.removeItem('wayzen.activeClientId');

    const resolvedUser = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      clientId: profile.client_id,
    };

    setUser(resolvedUser);
    return resolvedUser;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('wayzen.activeClientId');
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
