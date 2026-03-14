import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

  const slaDanger = strategic.slaFirstResponseMinutes > 5;
  const hasBeforeAfterData = data.trends.beforeAfterWayzen.some(
    (row) => Number(row.before || 0) !== 0 || Number(row.after || 0) !== 0
  );

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>SLA de Primeira Resposta</p>
            <p className={`${cardValue} ${slaDanger ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {strategic.slaFirstResponseMinutes.toFixed(1)} min
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Meta: abaixo de 5 min em horario comercial</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Leads recebidos</p>
            <p className={cardValue}>{strategic.leadsToday}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Leads sem resposta</p>
            <p className={`${cardValue} ${strategic.leadsUnanswered > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{strategic.leadsUnanswered}</p>
          </div>
        </div>
      </article>

      <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Grupo 2 — Funil Ativo</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 md:col-span-2">
            <p className={cardTitle}>Oportunidades abertas no funil</p>
            <p className={cardValue}>{strategic.opportunitiesOpen}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Contato inicial {strategic.opportunitiesByStage.contatoInicial} • Qualificado {strategic.opportunitiesByStage.qualificado} • Proposta {strategic.opportunitiesByStage.propostaEnviada} • Negociacao {strategic.opportunitiesByStage.negociacao} • Fechado {strategic.opportunitiesByStage.fechado}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Follow-ups realizados</p>
            <p className={cardValue}>{strategic.followUpsDone}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Follow-ups em atraso</p>
            <p className={`${cardValue} ${strategic.followUpsOverdue > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{strategic.followUpsOverdue}</p>
          </div>
        </div>
      </article>

      <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Grupo 3 — Resultado Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Matriculas no mes</p>
            <p className={cardValue}>{strategic.enrollmentsMonth}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Receita LOA parcial</p>
            <p className={cardValue}>R$ {strategic.loaRevenueMonth.toLocaleString('pt-BR')}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Ticket medio</p>
            <p className={cardValue}>R$ {strategic.avgTicket.toLocaleString('pt-BR')}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Meta do mes vs realizado</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{goalProgress.toFixed(1)}%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-2 rounded-full bg-wayzen-500" style={{ width: `${goalProgress}%` }} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              R$ {strategic.monthlyRealized.toLocaleString('pt-BR')} de R$ {strategic.monthlyGoal.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </article>

      <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Grupo 4 — Saude da Base</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Desistencias no mes</p>
            <p className={cardValue}>{strategic.churnMonth}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Inadimplencia ativa</p>
            <p className={cardValue}>{strategic.delinquencyRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>NPS semanal</p>
            <p className={cardValue}>{strategic.nps.toFixed(0)}</p>
          </div>
        </div>
      </article>

      <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Grupo 5 — Operacao Wayzen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Atividades Wayzen registradas</p>
            <p className={cardValue}>{strategic.wayzenActivitiesToday}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Variacao WoW de conversao</p>
            <p className={`${cardValue} ${strategic.weekOverWeekConversionVar < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {strategic.weekOverWeekConversionVar.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className={cardTitle}>Conversao da semana</p>
            <p className={cardValue}>{strategic.conversionRateWeek.toFixed(2)}%</p>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Variacao de Conversao Semana a Semana</h3>
          <div className="h-64">
            {data.trends.weekOverWeekConversion.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends.weekOverWeekConversion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} name="Conversao (%)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
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
                  <Bar dataKey="after" name="Hoje" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
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
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
