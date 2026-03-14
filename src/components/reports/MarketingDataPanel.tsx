import { useEffect, useState, type ReactNode } from 'react';
import { Trash2, Plus, Megaphone } from 'lucide-react';
import { usePortalScope } from '@/hooks/usePortalScope';
import { useAuth } from '@/hooks/useAuth';
import { portalService } from '@/lib/services/portal';
import { MarketingDataEntry } from '@/types/domain';
import PageLoader from '@/components/PageLoader';

const emptyForm = {
  periodDate: new Date().toISOString().slice(0, 10),
  channel: 'Meta Ads',
  campaignName: '',
  spend: 0,
  impressions: 0,
  clicks: 0,
  leads: 0,
  meetingsBooked: 0,
  proposalsSent: 0,
  dealsWon: 0,
  revenue: 0,
  notes: '',
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

type MarketingDataPanelProps = {
  embedded?: boolean;
};

export default function MarketingDataPanel({ embedded = false }: MarketingDataPanelProps) {
  const { user } = useAuth();
  const { isInternal, activeClientId, activeClient, loadingClients } = usePortalScope();
  const [entries, setEntries] = useState<MarketingDataEntry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    if (!user?.id) return;
    const data = await portalService.getMarketingDataEntries(user.id);
    setEntries(data as MarketingDataEntry[]);
  };

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    loadEntries()
      .catch((err) => {
        console.error(err);
        setError('Nao foi possivel carregar os dados de marketing.');
      })
      .finally(() => setLoading(false));
  }, [activeClientId, loadingClients, user?.id]);

  const handleCreate = async () => {
    if (!isInternal || !activeClientId) return;
    if (!form.campaignName.trim()) {
      setError('Informe o nome da campanha.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await portalService.createMarketingDataEntry({
        userId: user?.id || 0,
        periodDate: form.periodDate,
        channel: form.channel.trim() || 'Nao informado',
        campaignName: form.campaignName.trim(),
        spend: Number(form.spend) || 0,
        impressions: Number(form.impressions) || 0,
        clicks: Number(form.clicks) || 0,
        leads: Number(form.leads) || 0,
        meetingsBooked: Number(form.meetingsBooked) || 0,
        proposalsSent: Number(form.proposalsSent) || 0,
        dealsWon: Number(form.dealsWon) || 0,
        revenue: Number(form.revenue) || 0,
        notes: form.notes.trim() || undefined,
      });
      setForm(emptyForm);
      await loadEntries();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Nao foi possivel salvar o registro de marketing.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: number) => {
    if (!isInternal) return;
    try {
      await portalService.deleteMarketingDataEntry(entryId);
      setEntries((prev) => prev.filter((item) => item.id !== entryId));
    } catch (err) {
      console.error(err);
      setError('Nao foi possivel excluir o registro.');
    }
  };

  if (loading || loadingClients) return <PageLoader />;

  if (!activeClientId) {
    return <div className="card p-8 text-center text-gray-500 dark:text-slate-400">Selecione um portal para usar os dados de marketing.</div>;
  }

  return (
    <div className="space-y-5">
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dados de Marketing</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Entrada operacional de campanhas para {activeClient?.company_name || 'cliente'} integrada ao Analytics.
          </p>
        </div>
      )}

      {embedded && (
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Dados de Marketing Integrados ao Analytics</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registre campanhas e acompanhe o historico sem sair da aba Analytics.
          </p>
        </div>
      )}

      {isInternal && (
        <section className="card p-5 bg-white dark:bg-slate-900 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Novo registro de campanha</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Data da campanha">
              <input type="date" className="input-field" value={form.periodDate} onChange={(e) => setForm((p) => ({ ...p, periodDate: e.target.value }))} />
            </Field>
            <Field label="Canal">
              <input className="input-field" value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))} />
            </Field>
            <Field label="Nome da campanha">
              <input className="input-field" value={form.campaignName} onChange={(e) => setForm((p) => ({ ...p, campaignName: e.target.value }))} />
            </Field>
            <Field label="Investimento (R$)">
              <input type="number" min={0} className="input-field" value={form.spend} onChange={(e) => setForm((p) => ({ ...p, spend: Number(e.target.value) }))} />
            </Field>
            <Field label="Impressoes">
              <input type="number" min={0} className="input-field" value={form.impressions} onChange={(e) => setForm((p) => ({ ...p, impressions: Number(e.target.value) }))} />
            </Field>
            <Field label="Cliques">
              <input type="number" min={0} className="input-field" value={form.clicks} onChange={(e) => setForm((p) => ({ ...p, clicks: Number(e.target.value) }))} />
            </Field>
            <Field label="Leads gerados">
              <input type="number" min={0} className="input-field" value={form.leads} onChange={(e) => setForm((p) => ({ ...p, leads: Number(e.target.value) }))} />
            </Field>
            <Field label="Reunioes agendadas">
              <input type="number" min={0} className="input-field" value={form.meetingsBooked} onChange={(e) => setForm((p) => ({ ...p, meetingsBooked: Number(e.target.value) }))} />
            </Field>
            <Field label="Propostas enviadas">
              <input type="number" min={0} className="input-field" value={form.proposalsSent} onChange={(e) => setForm((p) => ({ ...p, proposalsSent: Number(e.target.value) }))} />
            </Field>
            <Field label="Negocios fechados">
              <input type="number" min={0} className="input-field" value={form.dealsWon} onChange={(e) => setForm((p) => ({ ...p, dealsWon: Number(e.target.value) }))} />
            </Field>
            <Field label="Receita (R$)">
              <input type="number" min={0} className="input-field" value={form.revenue} onChange={(e) => setForm((p) => ({ ...p, revenue: Number(e.target.value) }))} />
            </Field>
            <Field label="Observacoes">
              <textarea className="input-field h-[42px]" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </Field>
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button className="btn-primary mt-3" onClick={handleCreate} disabled={saving}>
            <Plus size={14} /> {saving ? 'Salvando...' : 'Salvar registro de marketing'}
          </button>
        </section>
      )}

      <section className="card p-5 bg-white dark:bg-slate-900 dark:border-slate-700">
        <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Historico de campanhas</h2>

        <div className="space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
                    <Megaphone size={14} /> {entry.campaign_name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(entry.period_date).toLocaleDateString('pt-BR')} • {entry.channel}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                    Leads: {entry.leads} • Reunioes: {entry.meetings_booked} • Propostas: {entry.proposals_sent} • Negocios: {entry.deals_won}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    Investimento: R$ {Number(entry.spend).toLocaleString('pt-BR')} • Receita: R$ {Number(entry.revenue).toLocaleString('pt-BR')}
                  </p>
                </div>
                {isInternal && (
                  <button
                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                    onClick={() => handleDelete(entry.id)}
                    aria-label={`Excluir campanha ${entry.campaign_name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {entry.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{entry.notes}</p>}
            </article>
          ))}

          {!entries.length && (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-700 dark:text-slate-500">
              Nenhum registro de marketing cadastrado.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}