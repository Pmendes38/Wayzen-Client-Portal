import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePortalScope } from '@/hooks/usePortalScope';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import {
  DailyLog,
  MarketingSalesAnalytics,
  SharedReport,
} from '@/types/domain';
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  ScrollText,
} from 'lucide-react';
import AnalyticsDashboard from '@/components/reports/AnalyticsDashboard';

type ReportTab = 'analytics' | 'daily_logs' | 'published_reports';

const analyticsSeed: MarketingSalesAnalytics = {
  marketing: [
    { period: 'Jan', leads: 92, costPerLead: 72, activeCampaigns: 3, conversionRate: 4.2 },
    { period: 'Fev', leads: 116, costPerLead: 67, activeCampaigns: 4, conversionRate: 4.8 },
    { period: 'Mar', leads: 141, costPerLead: 61, activeCampaigns: 4, conversionRate: 5.1 },
    { period: 'Abr', leads: 133, costPerLead: 64, activeCampaigns: 5, conversionRate: 4.9 },
  ],
  sales: [
    { period: 'Jan', meetings: 24, proposals: 12, dealsClosed: 5, averageTicket: 9800 },
    { period: 'Fev', meetings: 28, proposals: 14, dealsClosed: 7, averageTicket: 10300 },
    { period: 'Mar', meetings: 33, proposals: 18, dealsClosed: 9, averageTicket: 11200 },
    { period: 'Abr', meetings: 31, proposals: 16, dealsClosed: 8, averageTicket: 10800 },
  ],
  correlation: [
    { label: 'Jan', leads: 92, deals: 5 },
    { label: 'Fev', leads: 116, deals: 7 },
    { label: 'Mar', leads: 141, deals: 9 },
    { label: 'Abr', leads: 133, deals: 8 },
  ],
  funnel: [
    { stage: 'Visitantes', value: 4200 },
    { stage: 'Leads', value: 482 },
    { stage: 'MQL', value: 214 },
    { stage: 'Propostas', value: 60 },
    { stage: 'Negocios', value: 29 },
  ],
};

const tabClasses = (active: boolean) =>
  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border transition-colors ${
    active
      ? 'border-wayzen-300 bg-wayzen-100 text-wayzen-800 dark:border-wayzen-800 dark:bg-wayzen-900/30 dark:text-wayzen-200'
      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export default function Reports() {
  const { user } = useAuth();
  const { isInternal, activeClientId, activeClient, loadingClients } = usePortalScope();
  const [reports, setReports] = useState<SharedReport[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [activeTab, setActiveTab] = useState<ReportTab>('analytics');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'weekly',
    periodStart: '',
    periodEnd: '',
    content: '',
    metrics: '',
  });
  const [dailyLogForm, setDailyLogForm] = useState({
    logDate: new Date().toISOString().slice(0, 10),
    progressScore: 75,
    hoursWorked: 8,
    summary: '',
    blockers: '',
    nextSteps: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    Promise.all([
      portalService.getReports(activeClientId),
      portalService.getDailyLogs(activeClientId),
    ])
      .then(([reportData, logData]) => {
        setReports(reportData);
        setDailyLogs(logData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeClientId, loadingClients]);

  const clientId = activeClientId;

  const dailyLogsChartData = useMemo(
    () =>
      [...dailyLogs].reverse().map((entry) => ({
        date: new Date(entry.log_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        progresso: entry.progress_score,
        horas: entry.hours_worked,
      })),
    [dailyLogs]
  );

  const createReport = async () => {
    if (!isInternal || !clientId || !form.title || !form.periodStart || !form.periodEnd) return;

    await portalService.createReport({
      clientId,
      title: form.title,
      type: form.type,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      content: form.content,
      metrics: form.metrics ? { notes: form.metrics } : undefined,
    });

    const refreshed = await portalService.getReports(clientId);
    setReports(refreshed);
    setForm({ title: '', type: 'weekly', periodStart: '', periodEnd: '', content: '', metrics: '' });
  };

  const saveDailyLog = async () => {
    if (!isInternal || !clientId || !dailyLogForm.summary.trim()) return;

    await portalService.createDailyLog({
      clientId,
      logDate: dailyLogForm.logDate,
      progressScore: Number(dailyLogForm.progressScore),
      hoursWorked: Number(dailyLogForm.hoursWorked),
      summary: dailyLogForm.summary,
      blockers: dailyLogForm.blockers || undefined,
      nextSteps: dailyLogForm.nextSteps || undefined,
    });

    setDailyLogForm((prev) => ({ ...prev, summary: '', blockers: '', nextSteps: '' }));
    const refreshed = await portalService.getDailyLogs(clientId);
    setDailyLogs(refreshed);
  };

  if (loading || loadingClients) return <PageLoader />;

  if (!clientId) {
    return <div className="card p-8 text-center text-gray-500">Selecione um portal para ver relatórios.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Hub de Relatorios e Analytics</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          {isInternal
            ? `Visao central de inteligencia para ${activeClient?.company_name || ''}`
            : 'Desempenho consolidado com dados de marketing, vendas e operacao'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={tabClasses(activeTab === 'analytics')} onClick={() => setActiveTab('analytics')}>
          <BarChart3 size={15} /> Analytics
        </button>
        <button className={tabClasses(activeTab === 'daily_logs')} onClick={() => setActiveTab('daily_logs')}>
          <ScrollText size={15} /> Registro Diario
        </button>
        <button className={tabClasses(activeTab === 'published_reports')} onClick={() => setActiveTab('published_reports')}>
          <FileText size={15} /> Relatorios Publicados
        </button>
      </div>

      {activeTab === 'analytics' && <AnalyticsDashboard data={analyticsSeed} />}

      {activeTab === 'daily_logs' && (
        <section className="space-y-4">
          {isInternal && (
            <div className="card p-5 bg-white dark:bg-slate-900 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Registro Diario (integrado aos Relatorios)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="date" className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={dailyLogForm.logDate} onChange={(e) => setDailyLogForm((p) => ({ ...p, logDate: e.target.value }))} />
                <input type="number" min={0} max={100} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={dailyLogForm.progressScore} onChange={(e) => setDailyLogForm((p) => ({ ...p, progressScore: Number(e.target.value) }))} placeholder="Progresso 0-100" />
                <input type="number" min={0} max={24} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={dailyLogForm.hoursWorked} onChange={(e) => setDailyLogForm((p) => ({ ...p, hoursWorked: Number(e.target.value) }))} placeholder="Horas trabalhadas" />
              </div>
              <textarea className="input-field mt-3 h-20 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" placeholder="Resumo do dia" value={dailyLogForm.summary} onChange={(e) => setDailyLogForm((p) => ({ ...p, summary: e.target.value }))} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <textarea className="input-field h-20 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" placeholder="Bloqueios" value={dailyLogForm.blockers} onChange={(e) => setDailyLogForm((p) => ({ ...p, blockers: e.target.value }))} />
                <textarea className="input-field h-20 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" placeholder="Proximos passos" value={dailyLogForm.nextSteps} onChange={(e) => setDailyLogForm((p) => ({ ...p, nextSteps: e.target.value }))} />
              </div>
              <button className="btn-primary mt-3" onClick={saveDailyLog}>Salvar registro diario</button>
            </div>
          )}

          <div className="card p-5 bg-white dark:bg-slate-900 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Historico de Operacao</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dailyLogs.map((log) => (
                <article key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{new Date(log.log_date).toLocaleDateString('pt-BR')}</p>
                    <span className="badge badge-blue">{log.progress_score}%</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{log.summary}</p>
                  {log.next_steps && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Proximos passos: {log.next_steps}</p>}
                </article>
              ))}

              {!dailyLogs.length && (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-700 dark:text-slate-500 md:col-span-2">
                  Nenhum registro diario cadastrado.
                </div>
              )}
            </div>
            {!!dailyLogsChartData.length && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Ultimos {Math.min(10, dailyLogsChartData.length)} registros foram consolidados para alimentar os graficos de analytics.
              </p>
            )}
          </div>
        </section>
      )}

      {activeTab === 'published_reports' && (
        <section>
          {isInternal && (
            <div className="card p-5 mb-6 bg-white dark:bg-slate-900 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Gerar relatorio no portal</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" placeholder="Titulo" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                <select className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="custom">Customizado</option>
                </select>
                <button onClick={createReport} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={16} /> Publicar</button>
                <input className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" type="date" value={form.periodStart} onChange={(e) => setForm((p) => ({ ...p, periodStart: e.target.value }))} />
                <input className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" type="date" value={form.periodEnd} onChange={(e) => setForm((p) => ({ ...p, periodEnd: e.target.value }))} />
                <input className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" placeholder="Metricas-chave" value={form.metrics} onChange={(e) => setForm((p) => ({ ...p, metrics: e.target.value }))} />
              </div>
              <textarea className="input-field mt-3 h-24 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" placeholder="Resumo executivo e entregas" value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
            </div>
          )}

          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="card overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-700">
                <button onClick={() => setExpanded(expanded === report.id ? null : report.id)} className="w-full p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-wayzen-100 rounded-lg flex items-center justify-center dark:bg-wayzen-900/30">
                      <BarChart3 size={20} className="text-wayzen-600 dark:text-wayzen-300" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100">{report.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`badge ${report.type === 'weekly' ? 'badge-blue' : 'badge-purple'}`}>
                          {report.type === 'weekly' ? 'Semanal' : 'Mensal'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                          <Calendar size={12} />
                          {new Date(report.period_start).toLocaleDateString('pt-BR')} - {new Date(report.period_end).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expanded === report.id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                </button>
                {expanded === report.id && (
                  <div className="border-t border-gray-200 dark:border-slate-700 p-5 bg-gray-50 dark:bg-slate-800">
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-slate-300 text-sm">{report.content || 'Sem conteudo detalhado.'}</div>
                    {report.metrics && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Metricas</h4>
                        <pre className="text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700 overflow-auto text-slate-700 dark:text-slate-300">{typeof report.metrics === 'string' ? report.metrics : JSON.stringify(report.metrics, null, 2)}</pre>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-3">por {report.author_name} • {new Date(report.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
            ))}

            {!reports.length && (
              <div className="card p-12 text-center bg-white dark:bg-slate-900 dark:border-slate-700">
                <FileText size={48} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-gray-400">Nenhum relatorio disponivel ainda</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
