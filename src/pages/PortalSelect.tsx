import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePortalScope } from '@/hooks/usePortalScope';
import PageLoader from '@/components/PageLoader';
import { Building2, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { createClient, deleteClient } from '@/lib/queries';
import { useState } from 'react';

export default function PortalSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInternal, clients, activeClientId, setActiveClientId, loadingClients, refreshClients } = usePortalScope();
  const [creating, setCreating] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState<number | null>(null);
  const [newProject, setNewProject] = useState({ companyName: '', tradeName: '', contactName: '', contactEmail: '' });

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === activeClientId) ?? null,
    [clients, activeClientId]
  );

  if (loadingClients) return <PageLoader fullScreen />;

  if (!user) return <Navigate to="/login" replace />;

  if (!isInternal) {
    return <Navigate to="/" replace />;
  }

  const handleCreateProject = async () => {
    if (!newProject.companyName.trim() || !newProject.contactName.trim() || !newProject.contactEmail.trim()) {
      return;
    }

    setCreating(true);
    try {
      const created = await createClient({
        companyName: newProject.companyName.trim(),
        tradeName: newProject.tradeName.trim() || undefined,
        contactName: newProject.contactName.trim(),
        contactEmail: newProject.contactEmail.trim(),
      });
      await refreshClients?.();
      setActiveClientId(created.id);
      setNewProject({ companyName: '', tradeName: '', contactName: '', contactEmail: '' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (clientId: number, companyName: string) => {
    const ok = window.confirm(`Apagar o projeto/cliente "${companyName}"? Esta acao nao pode ser desfeita.`);
    if (!ok) return;

    setDeletingClientId(clientId);
    try {
      await deleteClient(clientId);
      if (activeClientId === clientId) {
        setActiveClientId(null);
      }
      await refreshClients?.();
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingClientId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <div className="card p-6 md:p-8 bg-white dark:bg-slate-900 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Escolha o portal para acessar</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Fluxo de acesso: login, escolha de portal, acesso ao ambiente com dados do cliente selecionado.
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Novo projeto</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cadastre um novo cliente direto no portal, sem edicao manual no banco.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <input className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Empresa" value={newProject.companyName} onChange={(e) => setNewProject((prev) => ({ ...prev, companyName: e.target.value }))} />
              <input className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Nome fantasia (opcional)" value={newProject.tradeName} onChange={(e) => setNewProject((prev) => ({ ...prev, tradeName: e.target.value }))} />
              <input className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Responsavel" value={newProject.contactName} onChange={(e) => setNewProject((prev) => ({ ...prev, contactName: e.target.value }))} />
              <input className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" type="email" placeholder="Email oficial de notificacoes" value={newProject.contactEmail} onChange={(e) => setNewProject((prev) => ({ ...prev, contactEmail: e.target.value }))} />
            </div>
            <button type="button" onClick={handleCreateProject} disabled={creating} className="btn-primary mt-3">
              <Plus size={16} /> {creating ? 'Criando...' : 'Novo projeto'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
            {clients.map((client) => {
              const selected = client.id === activeClientId;
              return (
                <button
                  key={client.id}
                  onClick={() => setActiveClientId(client.id)}
                  className={`card p-5 text-left border transition-colors ${selected ? 'border-wayzen-500 ring-1 ring-wayzen-500 bg-wayzen-50/40' : 'border-gray-200 hover:border-wayzen-300'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-400 dark:text-slate-500">Portal #{client.id}</p>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mt-1">{client.company_name}</h2>
                      {client.trade_name && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{client.trade_name}</p>}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-wayzen-100 text-wayzen-700 flex items-center justify-center">
                      {selected ? <CheckCircle2 size={20} /> : <Building2 size={20} />}
                    </div>
                  </div>
                  {user.role === 'admin' && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(client.id, client.company_name).catch(console.error);
                        }}
                        disabled={deletingClientId === client.id}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 disabled:opacity-60"
                      >
                        {deletingClientId === client.id ? 'Apagando...' : <><Trash2 size={12} /> Apagar projeto</>}
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {!clients.length && <div className="card p-8 mt-6 text-center text-gray-500 dark:text-slate-400">Nenhum cliente disponivel.</div>}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={!selectedClient}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Acessar Portal {selectedClient ? `de ${selectedClient.company_name}` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
