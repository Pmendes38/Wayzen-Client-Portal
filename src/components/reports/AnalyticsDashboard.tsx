import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MarketingSalesAnalytics } from '@/types/domain';

type AnalyticsDashboardProps = {
  data: MarketingSalesAnalytics;
  onNavigateToDailyLog?: () => void;
};

type ViewWindow = 'today' | 'week' | 'month';

const tabCls = (active: boolean) =>
  `inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? 'border-wayzen-500 bg-wayzen-500 text-white'
      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

const cardTitle = 'text-[11px] uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400';
const cardValue = 'mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100';

function EmptyChartState({ onNavigateToDailyLog }: { onNavigateToDailyLog?: () => void }) {
  return (
    <div className="h-full rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-center px-6">
      <div className="space-y-2">
        <p className="text-sm text-slate-600 dark:text-slate-300">Nenhum dado registrado ainda. Preencha o Registro Diario para visualizar.</p>
        {!!onNavigateToDailyLog && (
          <button onClick={onNavigateToDailyLog} className="inline-flex items-center rounded-lg border border-wayzen-400 px-3 py-1.5 text-xs font-semibold text-wayzen-700 hover:bg-wayzen-50 dark:border-wayzen-700 dark:text-wayzen-300 dark:hover:bg-wayzen-900/20">
            Ir para Registro Diario
          </button>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard({ data, onNavigateToDailyLog }: AnalyticsDashboardProps) {
  const [windowView, setWindowView] = useState<ViewWindow>('today');

  const strategic = useMemo(() => {
    if (windowView === 'week') return data.strategic.week;
    if (windowView === 'month') return data.strategic.month;
    return data.strategic.today;
  }, [data.strategic, windowView]);

  const goalProgress = useMemo(() => {
    if (!strategic.monthlyGoal) return 0;
    return Math.max(0, Math.min(100, (strategic.monthlyRealized / strategic.monthlyGoal) * 100));
  }, [strategic.monthlyGoal, strategic.monthlyRealized]);

  const slaColor = strategic.slaFirstResponseMinutes < 5 ? '#22c55e' : strategic.slaFirstResponseMinutes <= 10 ? '#f59e0b' : '#ef4444';
  const hasBeforeAfterData = data.trends.beforeAfterWayzen.some(
    (row) => Number(row.before || 0) !== 0 || Number(row.after || 0) !== 0
  );

  const snapshotSeries = data.trends.snapshotSeries || [];
  const periodSize = windowView === 'today' ? 1 : windowView === 'week' ? 7 : 30;

  const periodSeries = useMemo(() => {
    if (!snapshotSeries.length) return [];
    return snapshotSeries.slice(-periodSize);
  }, [snapshotSeries, periodSize]);

  const leadsByChannelHasData = periodSeries.some((row) => row.whatsapp || row.instagram || row.site || row.referral);

  const unansweredPercent = useMemo(() => {
    if (!strategic.leadsToday) return 0;
    return (strategic.leadsUnanswered / strategic.leadsToday) * 100;
  }, [strategic.leadsToday, strategic.leadsUnanswered]);

  const funnelData = [
    { name: 'Contato inicial', value: strategic.opportunitiesByStage.contatoInicial },
    { name: 'Qualificado', value: strategic.opportunitiesByStage.qualificado },
    { name: 'Proposta', value: strategic.opportunitiesByStage.propostaEnviada },
    { name: 'Negociacao', value: strategic.opportunitiesByStage.negociacao },
    { name: 'Fechado', value: strategic.opportunitiesByStage.fechado },
  ];
  const hasFunnelData = funnelData.some((item) => item.value > 0);

  const followupDonutData = [
    { name: 'Realizados', value: strategic.followUpsDone, color: '#10b981' },
    { name: 'Em atraso', value: strategic.followUpsOverdue, color: '#ef4444' },
  ];
  const hasFollowupData = followupDonutData.some((item) => item.value > 0);

  const targetEnrollments = Math.max(1, Math.round(strategic.monthlyGoal > 0 && strategic.avgTicket > 0 ? strategic.monthlyGoal / strategic.avgTicket : strategic.enrollmentsMonth || 1));
  const enrollmentProgress = Math.max(0, Math.min(100, (strategic.enrollmentsMonth / targetEnrollments) * 100));

  const financeBars = [
    { label: 'Financeiro', meta: strategic.monthlyGoal, realizado: strategic.monthlyRealized },
  ];

  const previousTicket = windowView === 'today'
    ? data.strategic.week.avgTicket
    : windowView === 'week'
      ? data.strategic.month.avgTicket
      : data.strategic.week.avgTicket;
  const ticketTrendUp = strategic.avgTicket >= previousTicket;

  const churnTone = strategic.churnMonth === 0 ? 'text-emerald-500' : strategic.churnMonth <= 2 ? 'text-amber-500' : 'text-red-500';

  const nps0To10 = strategic.nps > 10 ? strategic.nps / 10 : strategic.nps;
  const npsGaugeValue = Math.max(0, Math.min(10, nps0To10));

  const wowSeries = useMemo(() => {
    const base = (data.trends.weekOverWeekConversion || []).slice();
    if (windowView === 'today') return base.slice(-4);
    if (windowView === 'week') return base.slice(-8);
    return base.slice(-12);
  }, [data.trends.weekOverWeekConversion, windowView]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Analytics Educacional Wayzen</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pergunta central: o investimento esta sendo bem trabalhado hoje?</p>
        </div>
        <div className="inline-flex items-center gap-1">
          <button className={tabCls(windowView === 'today')} onClick={() => setWindowView('today')}>Hoje</button>
          <button className={tabCls(windowView === 'week')} onClick={() => setWindowView('week')}>Semana</button>
          <button className={tabCls(windowView === 'month')} onClick={() => setWindowView('month')}>Mes</button>
        </div>
      </div>

      <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Grupo 1 — Velocidade e Resposta</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 h-64">
            <p className={cardTitle}>SLA de Primeira Resposta</p>
            <ResponsiveContainer width="100%" height="88%">
              <RadialBarChart
                cx="50%"
                cy="60%"
                innerRadius="58%"
                outerRadius="90%"
                barSize={16}
                startAngle={220}
                endAngle={-40}
                data={[{ value: Math.min(15, strategic.slaFirstResponseMinutes) }]}
              >
                <RadialBar dataKey="value" fill={slaColor} cornerRadius={10} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)} min`} />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="-mt-3 text-center text-xs text-slate-500 dark:text-slate-400">{strategic.slaFirstResponseMinutes.toFixed(1)} min | verde &lt;5 | amarelo 5-10 | vermelho &gt;10</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 h-64">
            <p className={cardTitle}>Leads recebidos</p>
            {leadsByChannelHasData ? (
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={periodSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="whatsapp" name="WhatsApp" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="instagram" name="Instagram" fill="#f97316" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="site" name="Site" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="referral" name="Indicacao" fill="#a855f7" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState onNavigateToDailyLog={onNavigateToDailyLog} />
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Leads sem resposta</p>
            <p className={`${cardValue} ${strategic.leadsUnanswered > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{strategic.leadsUnanswered}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{unansweredPercent.toFixed(1)}% do total de leads do periodo</p>
          </div>
        </div>
      </article>

      <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Grupo 2 — Funil Ativo</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 h-72">
            <p className={cardTitle}>Funil visual (Contato → Fechado)</p>
            {hasFunnelData ? (
              <ResponsiveContainer width="100%" height="90%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState onNavigateToDailyLog={onNavigateToDailyLog} />
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 h-72">
            <p className={cardTitle}>Follow-ups: realizados vs em atraso</p>
            {hasFollowupData ? (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie data={followupDonutData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>
                    {followupDonutData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState onNavigateToDailyLog={onNavigateToDailyLog} />
            )}
          </div>
        </div>
      </article>

      <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Grupo 3 — Resultado Financeiro</h3>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Matriculas no mes (progresso da meta)</p>
            <p className={cardValue}>{strategic.enrollmentsMonth}</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-2 rounded-full bg-wayzen-500" style={{ width: `${enrollmentProgress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Meta estimada: {targetEnrollments} matriculas</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 h-64">
            <p className={cardTitle}>Meta do mes vs realizado</p>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={financeBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="meta" name="Meta" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realizado" name="Realizado" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Ticket medio</p>
            <p className={cardValue}>R$ {strategic.avgTicket.toLocaleString('pt-BR')}</p>
            <p className={`mt-1 text-sm font-semibold ${ticketTrendUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {ticketTrendUp ? '↑' : '↓'} vs janela anterior ({previousTicket.toLocaleString('pt-BR')})
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Receita LOA parcial: R$ {strategic.loaRevenueMonth.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Meta atingida: {goalProgress.toFixed(1)}%</p>
          </div>
        </div>
      </article>

      <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Grupo 4 — Saude da Base</h3>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Desistencias no mes</p>
            <p className={`${cardValue} ${churnTone}`}>{strategic.churnMonth}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Inadimplencia ativa</p>
            <p className={cardValue}>{strategic.delinquencyRate.toFixed(1)}%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.min(100, strategic.delinquencyRate)}%` }} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 h-56">
            <p className={cardTitle}>NPS semanal</p>
            <ResponsiveContainer width="100%" height="90%">
              <RadialBarChart
                cx="50%"
                cy="100%"
                innerRadius="55%"
                outerRadius="95%"
                barSize={14}
                startAngle={180}
                endAngle={0}
                data={[{ value: npsGaugeValue }]}
              >
                <RadialBar dataKey="value" fill="#22c55e" cornerRadius={10} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)} / 10`} />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="-mt-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">{npsGaugeValue.toFixed(1)} / 10</p>
          </div>
        </div>
      </article>

      <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Grupo 5 — Operacao Wayzen</h3>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Atividades Wayzen registradas</p>
            <p className={cardValue}>{strategic.wayzenActivitiesToday}</p>
            <p className={`mt-1 text-sm font-semibold ${strategic.weekOverWeekConversionVar < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              Variacao WoW: {strategic.weekOverWeekConversionVar.toFixed(2)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Conversao semanal: {strategic.conversionRateWeek.toFixed(2)}%</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 h-72 xl:col-span-2">
            <p className={cardTitle}>Variação WoW (ultimos registros)</p>
            {wowSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wowSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} name="Conversao (%)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState onNavigateToDailyLog={onNavigateToDailyLog} />
            )}
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Variação de Conversão Semana a Semana</h3>
          <div className="h-64">
            {wowSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wowSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2.5} name="Conversao (%)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState onNavigateToDailyLog={onNavigateToDailyLog} />
            )}
          </div>
        </article>

        <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Antes vs Depois da Wayzen</h3>
          <div className="h-64">
            {data.trends.beforeAfterWayzen.length && hasBeforeAfterData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trends.beforeAfterWayzen}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="before" name="Antes" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="after" name="Depois" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState onNavigateToDailyLog={onNavigateToDailyLog} />
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
