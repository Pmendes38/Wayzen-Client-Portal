import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePortalScope } from '@/hooks/usePortalScope';
import { getDashboardData } from '@/lib/queries';
import PageLoader from '@/components/PageLoader';
import { DashboardData } from '@/types/domain';
import { Bell, CalendarDays, MessageSquareMore, Plus, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts';

type CalendarEvent = {
  id: number;
  date: string;
  title: string;
  type: 'sprint' | 'meeting' | 'commitment';
};

const monthSales = [
  { name: 'Sem 1', value: 18000 },
  { name: 'Sem 2', value: 22400 },
  { name: 'Sem 3', value: 20800 },
  { name: 'Sem 4', value: 25200 },
];

const daySales = [
  { name: '09h', value: 6 },
  { name: '11h', value: 9 },
  { name: '13h', value: 5 },
  { name: '15h', value: 12 },
  { name: '17h', value: 8 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { isInternal, activeClient, activeClientId, loadingClients } = usePortalScope();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEvent, setNewEvent] = useState({ date: '', title: '', type: 'commitment' as CalendarEvent['type'] });

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    getDashboardData(activeClientId)
      .then((res) => {
        setData(res);

        const fromSprints = (res.activeSprints || [])
          .filter((s) => s.end_date)
          .map((s, idx) => ({
            id: idx + 1,
            date: s.end_date as string,
            title: `Fim da ${s.name}`,
            type: 'sprint' as const,
          }));

        setEvents(fromSprints);
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

  const addCalendarEvent = () => {
    if (!newEvent.date || !newEvent.title.trim()) return;
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        date: newEvent.date,
        title: newEvent.title.trim(),
        type: newEvent.type,
      },
    ]);
    setNewEvent({ date: '', title: '', type: 'commitment' });
  };

  if (loading || loadingClients) return <PageLoader />;

  if (!activeClientId) {
    return <div className="card p-8 text-center text-gray-500">Selecione um portal para visualizar o dashboard.</div>;
  }

  const companyName = activeClient?.company_name || data?.client?.company_name || 'Cliente';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Olá, {isInternal ? 'Administrador' : user?.name}!</h1>
          <p className="text-slate-500 mt-1">
            {isInternal
              ? `Visao administrativa do portal ${companyName}`
              : `Visao executiva do projeto ${companyName}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-700 rounded-xl px-4 py-2.5 min-w-[280px]">
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Conversas</p>
            <p className="text-sm font-semibold mt-0.5">{conversationHint}</p>
          </div>
          <button className="relative w-11 h-11 rounded-xl bg-slate-900 text-white inline-flex items-center justify-center">
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-emerald-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700">
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Grafico resumo de vendas no mes</h2>
            <span className="badge badge-green inline-flex items-center gap-1"><TrendingUp size={13} /> +12.3%</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthSales} margin={{ left: -16, right: 6, top: 6 }}>
                <defs>
                  <linearGradient id="monthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Vendas']} />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} fill="url(#monthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Grafico resumo de vendas no dia</h2>
            <span className="badge badge-blue inline-flex items-center gap-1"><MessageSquareMore size={13} /> Em tempo real</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daySales} margin={{ left: -18, right: 8, top: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v} vendas`, 'Volume']} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Calendario de marcos, reunioes e compromissos</h2>
          <span className="badge badge-purple inline-flex items-center gap-1"><CalendarDays size={13} /> Editavel</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            type="date"
            className="input-field"
            value={newEvent.date}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
          />
          <input
            className="input-field md:col-span-2"
            placeholder="Titulo do compromisso"
            value={newEvent.title}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
          />
          <div className="flex gap-2">
            <select
              className="input-field"
              value={newEvent.type}
              onChange={(e) => setNewEvent((prev) => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
            >
              <option value="sprint">Fim de Sprint</option>
              <option value="meeting">Reuniao</option>
              <option value="commitment">Compromisso</option>
            </select>
            <button className="btn-primary" onClick={addCalendarEvent}><Plus size={14} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {events
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((event) => (
              <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500">
                  {event.type === 'sprint' ? 'Sprint' : event.type === 'meeting' ? 'Reuniao' : 'Compromisso'}
                </p>
                <p className="font-semibold text-slate-900 mt-1">{event.title}</p>
                <p className="text-sm text-slate-500 mt-1">{new Date(event.date).toLocaleDateString('pt-BR')}</p>
              </div>
            ))}

          {!events.length && (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-400 md:col-span-2 lg:col-span-3">
              Nenhum evento registrado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
