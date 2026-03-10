import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Funnel,
  FunnelChart,
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
};

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const summary = useMemo(() => {
    const totalLeads = data.marketing.reduce((acc, item) => acc + item.leads, 0);
    const totalDeals = data.sales.reduce((acc, item) => acc + item.dealsClosed, 0);
    const avgTicket = data.sales.length
      ? Math.round(data.sales.reduce((acc, item) => acc + item.averageTicket, 0) / data.sales.length)
      : 0;

    return { totalLeads, totalDeals, avgTicket };
  }, [data.marketing, data.sales]);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Leads gerados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{summary.totalLeads}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">marketing consolidado no periodo</p>
        </article>
        <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Negocios fechados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{summary.totalDeals}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">execucao comercial do consultor</p>
        </article>
        <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Ticket medio</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">R$ {summary.avgTicket.toLocaleString('pt-BR')}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">media por negocio fechado</p>
        </article>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Correlacao Marketing x Vendas</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.correlation}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#0ea5e9" strokeWidth={2.5} name="Leads" />
                <Line type="monotone" dataKey="deals" stroke="#10b981" strokeWidth={2.5} name="Negocios" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Campanhas e Custo por Lead</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.marketing}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
                <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="leads" fill="#6366f1" name="Leads" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="costPerLead" fill="#f97316" name="CPL" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="card p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Funil de Conversao Consolidado</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={data.funnel} isAnimationActive nameKey="stage" fill="#14b8a6" />
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
