import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePortalScope } from '@/hooks/usePortalScope';
import { getDashboardData } from '@/lib/queries';
import PageLoader from '@/components/PageLoader';
import { DashboardData } from '@/types/domain';
import { Bell, MessageSquareMore, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts';
import InteractiveCalendar from '@/components/reports/InteractiveCalendar';
import { buildSprintCalendarEvents, useProjectCalendar } from '@/hooks/useProjectCalendar';
import { portalService } from '@/lib/services/portal';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isInternal, activeClient, activeClientId, loadingClients } = usePortalScope();
  const [data, setData] = useState<DashboardData | null>(null);
  const [series, setSeries] = useState<{ monthSales: Array<{ name: string; value: number }>; daySales: Array<{ name: string; value: number }> }>({ monthSales: [], daySales: [] });
  const [loading, setLoading] = useState(true);
  const seedEvents = useMemo(() => buildSprintCalendarEvents(data?.activeSprints || []), [data?.activeSprints]);
  const { events, setEvents } = useProjectCalendar(activeClientId, seedEvents);

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    Promise.all([
      getDashboardData(activeClientId),
      portalService.getDashboardSalesSeries(activeClientId),
    ])
      .then(([res, salesSeries]) => {
        setData(res);
        setSeries(salesSeries);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeClientId, loadingClients]);

  const progressPercent = useMemo(() => {
    if (!data?.sprintProgress.total) return 0;
    return Math.round((data.sprintProgress.completed / data.sprintProgress.total) * 100);
  }, [data]);

  const unreadNotifications = useMemo(() => {
    const base = data?.openTickets || 0;
    return Math.max(0, base);
  }, [data]);

  const conversationHint = useMemo(() => {
    if (!data?.recentUpdates?.length) return 'Sem novas conversas no momento';
    const latest = data.recentUpdates[0];
    return `Ultima conversa: ${latest.title}`;
  }, [data]);

  if (loading || loadingClients) return <PageLoader />;

  if (!activeClientId) {
    return <div className="card p-8 text-center text-gray-500 dark:text-slate-400">Selecione um portal para visualizar o dashboard.</div>;
  }

  const companyName = activeClient?.company_name || data?.client?.company_name || 'Cliente';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Olá, {isInternal ? 'Administrador' : user?.name}!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isInternal
              ? `Visao administrativa do portal ${companyName}`
              : `Visao executiva do projeto ${companyName}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2.5 min-w-[280px] border border-slate-200 dark:border-slate-700">
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Conversas</p>
            <button className="text-sm font-semibold mt-0.5 text-left hover:underline" onClick={() => navigate('/tickets')}>{conversationHint}</button>
          </div>
          <button onClick={() => navigate('/notifications')} className="relative w-11 h-11 rounded-xl bg-slate-900 dark:bg-wayzen-700 text-white inline-flex items-center justify-center">
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-emerald-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      <button onClick={() => navigate('/sprints')} className="card w-full text-left p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700 hover:opacity-95">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-300">Resumo da conclusao das sprints</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-5xl font-extrabold leading-none">{progressPercent}%</p>
            <p className="text-slate-300 mt-2">Taxa geral de conclusao do ciclo atual</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 border border-white/10">
            <p className="text-sm text-slate-200">{data?.sprintProgress.completed || 0} tarefas concluidas de {data?.sprintProgress.total || 0}</p>
            <div className="mt-2 h-2.5 rounded-full bg-white/10 w-64 max-w-full">
              <div className="h-2.5 rounded-full bg-emerald-400" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <button onClick={() => navigate('/reports')} className="card p-5 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Grafico resumo de vendas no mes</h2>
            <span className="badge badge-green inline-flex items-center gap-1"><TrendingUp size={13} /> +12.3%</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series.monthSales} margin={{ left: -16, right: 6, top: 6 }}>
                <defs>
                  <linearGradient id="monthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString('pt-BR')} eventos`, 'Volume']} />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} fill="url(#monthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </button>

        <button onClick={() => navigate('/reports')} className="card p-5 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Grafico resumo de vendas no dia</h2>
            <span className="badge badge-blue inline-flex items-center gap-1"><MessageSquareMore size={13} /> Em tempo real</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series.daySales} margin={{ left: -18, right: 8, top: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v} vendas`, 'Volume']} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </button>
      </div>

      <InteractiveCalendar initialEvents={events} onEventsChange={setEvents} />
    </div>
  );
}
