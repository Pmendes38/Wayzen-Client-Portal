import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/pages/Dashboard';
import Sprints from '@/pages/Sprints';
import { Clock3, BarChart3 } from 'lucide-react';

export default function Cliente() {
  const { user } = useAuth();

  if (user?.role !== 'client') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <section className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-wayzen-100 text-wayzen-700 dark:bg-wayzen-900/30 dark:text-wayzen-300 flex items-center justify-center">
            <Clock3 size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Portal do Cliente</p>
            <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-0.5">Acompanhamento de Cronograma</h1>
            <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
              Esta area foi focada para cliente com visao de sprint, prazos e indicadores de performance. O Kanban interno da Wayzen nao fica disponivel aqui.
            </p>
          </div>
        </div>
      </section>

      <section className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={18} className="text-wayzen-600 dark:text-wayzen-300" />
          <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Dashboard com Numeros</h2>
        </div>
        <Dashboard />
      </section>

      <section className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-3">Cronograma das Sprints</h2>
        <Sprints />
      </section>

    </div>
  );
}
