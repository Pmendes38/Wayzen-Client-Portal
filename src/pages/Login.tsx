import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    let timer: number | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await withTimeout(login(email, password), 25000, 'Login demorou mais do que o esperado. Tente novamente.');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-brand-midnight via-wayzen-700 to-brand-black text-white p-10 xl:p-14">
        <div className="absolute inset-0 bg-wayzen-glow opacity-80" />
        <div className="relative z-10 flex flex-col justify-between w-full">
          <div className="inline-flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center">
              <span className="font-extrabold text-xl">W</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-wayzen-100">Wayzen</p>
              <p className="text-lg font-bold">Client Portal</p>
            </div>
          </div>

          <div className="max-w-xl">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
              Visibilidade completa da operacao comercial do cliente.
            </h1>
            <p className="mt-4 text-wayzen-100 text-base xl:text-lg">
              Um portal proprietario para acompanhar sprint, tickets, documentos e relatorios com clareza executiva.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-xl text-center">
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">
              <p className="text-xl font-extrabold">+30%</p>
              <p className="text-xs text-wayzen-100">Produtividade</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">
              <p className="text-xl font-extrabold">SLA</p>
              <p className="text-xs text-wayzen-100">Tickets claros</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">
              <p className="text-xl font-extrabold">1 hub</p>
              <p className="text-xs text-wayzen-100">Tudo centralizado</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-4 md:p-8 bg-slate-50/70">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 lg:hidden">
            <div className="w-14 h-14 bg-wayzen-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-soft">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <h1 className="text-2xl font-extrabold text-brand-midnight">Wayzen Client Portal</h1>
          </div>

          <div className="card p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Entrar na sua conta</h2>
            <p className="text-sm text-gray-500 mb-6">Acesse seu painel para acompanhar entregas e resultados.</p>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="seu@email.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                <LogIn size={18} />
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                A autenticação é feita exclusivamente pelo Supabase Auth.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
