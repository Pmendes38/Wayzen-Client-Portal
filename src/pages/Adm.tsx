import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { createClient, getClients, updateClient } from '@/lib/queries';
import { Plus, X, Loader2, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';

interface ClientRow {
  id: number;
  company_name: string;
  trade_name?: string | null;
  cnpj?: string | null;
  segment?: string | null;
  contact_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  status: string;
  monthly_fee?: number | null;
  contract_start?: string | null;
  contract_end?: string | null;
  created_at: string;
}

const emptyClientForm = {
  companyName: '',
  tradeName: '',
  cnpj: '',
  segment: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  monthlyFee: '',
  contractStart: '',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-wayzen-400';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    churned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  const labels: Record<string, string> = {
    active: 'Ativo', paused: 'Pausado', churned: 'Encerrado',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function Adm() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [savingClient, setSavingClient] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    getClients()
      .then((data) => setClients(data as ClientRow[]))
      .catch(console.error)
      .finally(() => setLoadingClients(false));
  }, []);

  function showMsg(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setSavingClient(true);
    try {
      const created = await createClient({
        companyName: clientForm.companyName,
        tradeName: clientForm.tradeName || undefined,
        cnpj: clientForm.cnpj || undefined,
        segment: clientForm.segment || undefined,
        contactName: clientForm.contactName,
        contactEmail: clientForm.contactEmail,
        contactPhone: clientForm.contactPhone || undefined,
        monthlyFee: clientForm.monthlyFee ? Number(clientForm.monthlyFee) : 0,
        contractStart: clientForm.contractStart || undefined,
      }) as ClientRow;

      setClients((prev) => [created, ...prev]);
      setShowClientForm(false);
      setClientForm(emptyClientForm);
      showMsg('success', `Cliente "${created.company_name}" cadastrado com sucesso!`);
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : 'Erro ao cadastrar cliente.');
    } finally {
      setSavingClient(false);
    }
  }

  function startEdit(client: ClientRow) {
    setEditingClientId(client.id);
    setShowClientForm(true);
    setClientForm({
      companyName: client.company_name ?? '',
      tradeName: client.trade_name ?? '',
      cnpj: client.cnpj ?? '',
      segment: client.segment ?? '',
      contactName: client.contact_name ?? '',
      contactEmail: client.contact_email ?? '',
      contactPhone: client.contact_phone ?? '',
      monthlyFee: String(client.monthly_fee ?? 0),
      contractStart: client.contract_start ?? '',
    });
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    if (editingClientId === null) {
      await handleCreateClient(e);
      return;
    }

    setSavingClient(true);
    try {
      const updated = await updateClient(editingClientId, {
        companyName: clientForm.companyName,
        tradeName: clientForm.tradeName || undefined,
        cnpj: clientForm.cnpj || undefined,
        segment: clientForm.segment || undefined,
        contactName: clientForm.contactName,
        contactEmail: clientForm.contactEmail,
        contactPhone: clientForm.contactPhone || undefined,
        monthlyFee: clientForm.monthlyFee ? Number(clientForm.monthlyFee) : 0,
        contractStart: clientForm.contractStart || undefined,
      }) as ClientRow;

      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setShowClientForm(false);
      setEditingClientId(null);
      setClientForm(emptyClientForm);
      showMsg('success', `Cliente "${updated.company_name}" atualizado com sucesso!`);
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : 'Erro ao atualizar cliente.');
    } finally {
      setSavingClient(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Visao do Administrador</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Gestao de Clientes</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Cadastro e visao dos clientes da operacao.</p>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
            : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {loadingClients ? 'Carregando...' : `${clients.length} cliente(s) cadastrado(s)`}
        </p>
        <button
          onClick={() => {
            setEditingClientId(null);
            setClientForm(emptyClientForm);
            setShowClientForm((v) => !v);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-wayzen-600 hover:bg-wayzen-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {showClientForm ? <X size={15} /> : <Plus size={15} />}
          {showClientForm ? 'Cancelar' : 'Novo Cliente'}
        </button>
      </div>

      {showClientForm && (
        <form
          onSubmit={handleSaveClient}
          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Razao Social" required>
              <input className={inputCls} value={clientForm.companyName} onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })} required />
            </Field>
            <Field label="Nome Fantasia">
              <input className={inputCls} value={clientForm.tradeName} onChange={(e) => setClientForm({ ...clientForm, tradeName: e.target.value })} />
            </Field>
            <Field label="CNPJ">
              <input className={inputCls} value={clientForm.cnpj} onChange={(e) => setClientForm({ ...clientForm, cnpj: e.target.value })} />
            </Field>
            <Field label="Segmento">
              <input className={inputCls} value={clientForm.segment} onChange={(e) => setClientForm({ ...clientForm, segment: e.target.value })} />
            </Field>
            <Field label="Nome do Responsavel" required>
              <input className={inputCls} value={clientForm.contactName} onChange={(e) => setClientForm({ ...clientForm, contactName: e.target.value })} required />
            </Field>
            <Field label="E-mail do Responsavel" required>
              <input type="email" className={inputCls} value={clientForm.contactEmail} onChange={(e) => setClientForm({ ...clientForm, contactEmail: e.target.value })} required />
            </Field>
            <Field label="Telefone">
              <input className={inputCls} value={clientForm.contactPhone} onChange={(e) => setClientForm({ ...clientForm, contactPhone: e.target.value })} />
            </Field>
            <Field label="Mensalidade (R$)">
              <input type="number" min={0} className={inputCls} value={clientForm.monthlyFee} onChange={(e) => setClientForm({ ...clientForm, monthlyFee: e.target.value })} />
            </Field>
            <Field label="Inicio do Contrato">
              <input type="date" className={inputCls} value={clientForm.contractStart} onChange={(e) => setClientForm({ ...clientForm, contractStart: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setShowClientForm(false); setEditingClientId(null); setClientForm(emptyClientForm); }} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={savingClient} className="flex items-center gap-2 px-4 py-2 bg-wayzen-600 hover:bg-wayzen-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
              {savingClient && <Loader2 size={14} className="animate-spin" />}
              {editingClientId ? 'Salvar Alteracoes' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      )}

      {loadingClients ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-wayzen-500" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Empresa</th>
                <th className="px-4 py-3 text-left">Responsavel</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Acoes</th>
                <th className="px-4 py-3 text-left">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{c.company_name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{c.contact_name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{c.contact_email ?? '—'}</td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      <Pencil size={13} />
                      Editar
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-xs">{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
