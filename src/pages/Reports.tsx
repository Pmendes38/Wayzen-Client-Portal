import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePortalScope } from '@/hooks/usePortalScope';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import {
  DailyLog,
  DailyOperationalSnapshot,
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
  const [analyticsData, setAnalyticsData] = useState<MarketingSalesAnalytics>({
    marketing: [],
    sales: [],
    correlation: [],
    funnel: [],
    strategic: {
      today: {
        slaFirstResponseMinutes: 0,
        leadsToday: 0,
        leadsUnanswered: 0,
        opportunitiesOpen: 0,
        opportunitiesByStage: { contatoInicial: 0, qualificado: 0, propostaEnviada: 0, negociacao: 0, fechado: 0 },
        followUpsDone: 0,
        followUpsOverdue: 0,
        conversionRateWeek: 0,
        enrollmentsMonth: 0,
        loaRevenueMonth: 0,
        avgTicket: 0,
        monthlyGoal: 0,
        monthlyRealized: 0,
        churnMonth: 0,
        delinquencyRate: 0,
        nps: 0,
        wayzenActivitiesToday: 0,
        weekOverWeekConversionVar: 0,
        baseline: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
        current: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
      },
      week: {
        slaFirstResponseMinutes: 0,
        leadsToday: 0,
        leadsUnanswered: 0,
        opportunitiesOpen: 0,
        opportunitiesByStage: { contatoInicial: 0, qualificado: 0, propostaEnviada: 0, negociacao: 0, fechado: 0 },
        followUpsDone: 0,
        followUpsOverdue: 0,
        conversionRateWeek: 0,
        enrollmentsMonth: 0,
        loaRevenueMonth: 0,
        avgTicket: 0,
        monthlyGoal: 0,
        monthlyRealized: 0,
        churnMonth: 0,
        delinquencyRate: 0,
        nps: 0,
        wayzenActivitiesToday: 0,
        weekOverWeekConversionVar: 0,
        baseline: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
        current: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
      },
      month: {
        slaFirstResponseMinutes: 0,
        leadsToday: 0,
        leadsUnanswered: 0,
        opportunitiesOpen: 0,
        opportunitiesByStage: { contatoInicial: 0, qualificado: 0, propostaEnviada: 0, negociacao: 0, fechado: 0 },
        followUpsDone: 0,
        followUpsOverdue: 0,
        conversionRateWeek: 0,
        enrollmentsMonth: 0,
        loaRevenueMonth: 0,
        avgTicket: 0,
        monthlyGoal: 0,
        monthlyRealized: 0,
        churnMonth: 0,
        delinquencyRate: 0,
        nps: 0,
        wayzenActivitiesToday: 0,
        weekOverWeekConversionVar: 0,
        baseline: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
        current: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
      },
    },
    trends: { weekOverWeekConversion: [], beforeAfterWayzen: [] },
  });
  const [snapshots, setSnapshots] = useState<DailyOperationalSnapshot[]>([]);
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
  const [snapshotForm, setSnapshotForm] = useState({
    slaFirstResponseMinutes: 0,
    leadsWhatsapp: 0,
    leadsInstagram: 0,
    leadsSite: 0,
    leadsReferral: 0,
    leadsUnanswered: 0,
    opportunitiesContatoInicial: 0,
    opportunitiesQualificado: 0,
    opportunitiesPropostaEnviada: 0,
    opportunitiesNegociacao: 0,
    opportunitiesFechado: 0,
    followupsDone: 0,
    followupsOverdue: 0,
    conversionRateWeek: 0,
    enrollmentsMonth: 0,
    loaRevenueMonth: 0,
    avgTicket: 0,
    monthlyGoal: 0,
    monthlyRealized: 0,
    churnMonth: 0,
    delinquencyRate: 0,
    npsWeekly: 0,
    wayzenActivitiesToday: 0,
    wowConversionVar: 0,
    baselineConversionRate: 0,
    baselineMonthlyRevenue: 0,
    baselineAvgTicket: 0,
    currentConversionRate: 0,
    currentMonthlyRevenue: 0,
    currentAvgTicket: 0,
  });
  const [loading, setLoading] = useState(true);

  const refreshAnalytics = async (clientIdValue: number) => {
    const analytics = await portalService.getAnalyticsData(clientIdValue);
    setAnalyticsData(analytics as MarketingSalesAnalytics);
  };

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    Promise.all([
      portalService.getReports(activeClientId),
      portalService.getDailyLogs(activeClientId),
      portalService.getAnalyticsData(activeClientId),
      portalService.getDailyOperationalSnapshots(activeClientId),
    ])
      .then(([reportData, logData, analytics, snapshotData]) => {
        setReports(reportData);
        setDailyLogs(logData);
        setAnalyticsData(analytics as MarketingSalesAnalytics);
        setSnapshots(snapshotData as DailyOperationalSnapshot[]);
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

  const updateSnapshotField = (field: keyof typeof snapshotForm, value: number) => {
    setSnapshotForm((prev) => ({ ...prev, [field]: value }));
  };

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
    await refreshAnalytics(clientId);
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

    await portalService.upsertDailyOperationalSnapshot({
      clientId,
      snapshotDate: dailyLogForm.logDate,
      ...snapshotForm,
    });

    setDailyLogForm((prev) => ({ ...prev, summary: '', blockers: '', nextSteps: '' }));
    const refreshed = await portalService.getDailyLogs(clientId);
    const refreshedSnapshots = await portalService.getDailyOperationalSnapshots(clientId);
    setDailyLogs(refreshed);
    setSnapshots(refreshedSnapshots as DailyOperationalSnapshot[]);
    await refreshAnalytics(clientId);
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

      {activeTab === 'analytics' && <AnalyticsDashboard data={analyticsData} />}

      {activeTab === 'daily_logs' && (
        <section className="space-y-4">
          {isInternal && (
            <div className="card p-5 bg-white dark:bg-slate-900 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Registro Diario + Planilha Operacional (sincroniza com Analytics)</h2>
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

              <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Planilha de Indicadores do Dia</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Preencha uma vez por dia. Esses campos alimentam os graficos e cards da aba Analytics.</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
                  <input type="number" min={0} step="0.1" className="input-field" placeholder="SLA 1a resposta (min)" value={snapshotForm.slaFirstResponseMinutes} onChange={(e) => updateSnapshotField('slaFirstResponseMinutes', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Leads WhatsApp" value={snapshotForm.leadsWhatsapp} onChange={(e) => updateSnapshotField('leadsWhatsapp', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Leads Instagram" value={snapshotForm.leadsInstagram} onChange={(e) => updateSnapshotField('leadsInstagram', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Leads Site" value={snapshotForm.leadsSite} onChange={(e) => updateSnapshotField('leadsSite', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Leads Indicacao" value={snapshotForm.leadsReferral} onChange={(e) => updateSnapshotField('leadsReferral', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Leads sem resposta" value={snapshotForm.leadsUnanswered} onChange={(e) => updateSnapshotField('leadsUnanswered', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Funil: contato inicial" value={snapshotForm.opportunitiesContatoInicial} onChange={(e) => updateSnapshotField('opportunitiesContatoInicial', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Funil: qualificado" value={snapshotForm.opportunitiesQualificado} onChange={(e) => updateSnapshotField('opportunitiesQualificado', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Funil: proposta" value={snapshotForm.opportunitiesPropostaEnviada} onChange={(e) => updateSnapshotField('opportunitiesPropostaEnviada', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Funil: negociacao" value={snapshotForm.opportunitiesNegociacao} onChange={(e) => updateSnapshotField('opportunitiesNegociacao', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Funil: fechado" value={snapshotForm.opportunitiesFechado} onChange={(e) => updateSnapshotField('opportunitiesFechado', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Follow-ups realizados" value={snapshotForm.followupsDone} onChange={(e) => updateSnapshotField('followupsDone', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Follow-ups em atraso" value={snapshotForm.followupsOverdue} onChange={(e) => updateSnapshotField('followupsOverdue', Number(e.target.value))} />
                  <input type="number" min={0} step="0.01" className="input-field" placeholder="Conversao semana (%)" value={snapshotForm.conversionRateWeek} onChange={(e) => updateSnapshotField('conversionRateWeek', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Matriculas no mes" value={snapshotForm.enrollmentsMonth} onChange={(e) => updateSnapshotField('enrollmentsMonth', Number(e.target.value))} />
                  <input type="number" min={0} step="0.01" className="input-field" placeholder="LOA parcial (R$)" value={snapshotForm.loaRevenueMonth} onChange={(e) => updateSnapshotField('loaRevenueMonth', Number(e.target.value))} />
                  <input type="number" min={0} step="0.01" className="input-field" placeholder="Ticket medio (R$)" value={snapshotForm.avgTicket} onChange={(e) => updateSnapshotField('avgTicket', Number(e.target.value))} />
                  <input type="number" min={0} step="0.01" className="input-field" placeholder="Meta mensal (R$)" value={snapshotForm.monthlyGoal} onChange={(e) => updateSnapshotField('monthlyGoal', Number(e.target.value))} />
                  <input type="number" min={0} step="0.01" className="input-field" placeholder="Realizado mensal (R$)" value={snapshotForm.monthlyRealized} onChange={(e) => updateSnapshotField('monthlyRealized', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Desistencias no mes" value={snapshotForm.churnMonth} onChange={(e) => updateSnapshotField('churnMonth', Number(e.target.value))} />
                  <input type="number" min={0} step="0.01" className="input-field" placeholder="Inadimplencia (%)" value={snapshotForm.delinquencyRate} onChange={(e) => updateSnapshotField('delinquencyRate', Number(e.target.value))} />
                  <input type="number" min={0} max={100} className="input-field" placeholder="NPS semanal" value={snapshotForm.npsWeekly} onChange={(e) => updateSnapshotField('npsWeekly', Number(e.target.value))} />
                  <input type="number" min={0} className="input-field" placeholder="Atividades Wayzen hoje" value={snapshotForm.wayzenActivitiesToday} onChange={(e) => updateSnapshotField('wayzenActivitiesToday', Number(e.target.value))} />
                  <input type="number" step="0.01" className="input-field" placeholder="Variacao WoW conversao (%)" value={snapshotForm.wowConversionVar} onChange={(e) => updateSnapshotField('wowConversionVar', Number(e.target.value))} />
                  <input type="number" step="0.01" className="input-field" placeholder="Antes Wayzen: conversao (%)" value={snapshotForm.baselineConversionRate} onChange={(e) => updateSnapshotField('baselineConversionRate', Number(e.target.value))} />
                  <input type="number" step="0.01" className="input-field" placeholder="Antes Wayzen: receita mensal" value={snapshotForm.baselineMonthlyRevenue} onChange={(e) => updateSnapshotField('baselineMonthlyRevenue', Number(e.target.value))} />
                  <input type="number" step="0.01" className="input-field" placeholder="Antes Wayzen: ticket medio" value={snapshotForm.baselineAvgTicket} onChange={(e) => updateSnapshotField('baselineAvgTicket', Number(e.target.value))} />
                  <input type="number" step="0.01" className="input-field" placeholder="Hoje: conversao (%)" value={snapshotForm.currentConversionRate} onChange={(e) => updateSnapshotField('currentConversionRate', Number(e.target.value))} />
                  <input type="number" step="0.01" className="input-field" placeholder="Hoje: receita mensal" value={snapshotForm.currentMonthlyRevenue} onChange={(e) => updateSnapshotField('currentMonthlyRevenue', Number(e.target.value))} />
                  <input type="number" step="0.01" className="input-field" placeholder="Hoje: ticket medio" value={snapshotForm.currentAvgTicket} onChange={(e) => updateSnapshotField('currentAvgTicket', Number(e.target.value))} />
                </div>
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

          <div className="card p-5 bg-white dark:bg-slate-900 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Planilha Sincronizada de Indicadores</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Data</th>
                    <th className="px-3 py-2 text-left">SLA (min)</th>
                    <th className="px-3 py-2 text-left">Leads</th>
                    <th className="px-3 py-2 text-left">Sem resposta</th>
                    <th className="px-3 py-2 text-left">Follow-ups</th>
                    <th className="px-3 py-2 text-left">Conversao semana</th>
                    <th className="px-3 py-2 text-left">Matriculas mes</th>
                    <th className="px-3 py-2 text-left">LOA parcial</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((row) => {
                    const leads = Number(row.leads_whatsapp || 0) + Number(row.leads_instagram || 0) + Number(row.leads_site || 0) + Number(row.leads_referral || 0);
                    return (
                      <tr key={row.id} className="border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <td className="px-3 py-2">{new Date(row.snapshot_date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-3 py-2">{Number(row.sla_first_response_minutes || 0).toFixed(1)}</td>
                        <td className="px-3 py-2">{leads}</td>
                        <td className="px-3 py-2">{row.leads_unanswered}</td>
                        <td className="px-3 py-2">{row.followups_done}</td>
                        <td className="px-3 py-2">{Number(row.conversion_rate_week || 0).toFixed(2)}%</td>
                        <td className="px-3 py-2">{row.enrollments_month}</td>
                        <td className="px-3 py-2">R$ {Number(row.loa_revenue_month || 0).toLocaleString('pt-BR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!snapshots.length && (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-700 dark:text-slate-500 mt-3">
                Nenhuma linha da planilha operacional foi registrada ainda.
              </div>
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
