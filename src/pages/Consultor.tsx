import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePortalScope } from '@/hooks/usePortalScope';
import Dashboard from '@/pages/Dashboard';

export default function Consultor() {
  const { user } = useAuth();
  const { activeClient } = usePortalScope();

  if (user?.role !== 'consultant') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-4">
      <section className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Visao do Consultor</p>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-1">Painel do Consultor</h1>
        <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
          Cliente ativo: <strong>{activeClient?.company_name ?? 'Nenhum selecionado'}</strong>
        </p>
        <Link
          to="/portal-select"
          className="inline-flex mt-3 px-3 py-1.5 rounded-lg bg-wayzen-600 hover:bg-wayzen-700 text-white text-sm font-semibold"
        >
          Trocar cliente ativo
        </Link>
      </section>
      <Dashboard />
    </div>
  );
}
