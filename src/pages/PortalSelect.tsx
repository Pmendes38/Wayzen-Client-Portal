import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePortalScope } from '@/hooks/usePortalScope';
import PageLoader from '@/components/PageLoader';
import { Building2, CheckCircle2 } from 'lucide-react';

export default function PortalSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInternal, clients, activeClientId, setActiveClientId, loadingClients } = usePortalScope();

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === activeClientId) ?? null,
    [clients, activeClientId]
  );

  if (loadingClients) return <PageLoader fullScreen />;

  if (!user) return <Navigate to="/login" replace />;

  if (!isInternal) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <div className="card p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Escolha o portal para acessar</h1>
          <p className="text-gray-500 mt-1">
            Fluxo de acesso: login, escolha de portal, acesso ao ambiente com dados do cliente selecionado.
          </p>

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
                      <p className="text-sm text-gray-400">Portal #{client.id}</p>
                      <h2 className="text-lg font-semibold text-gray-900 mt-1">{client.company_name}</h2>
                      {client.trade_name && <p className="text-sm text-gray-500 mt-1">{client.trade_name}</p>}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-wayzen-100 text-wayzen-700 flex items-center justify-center">
                      {selected ? <CheckCircle2 size={20} /> : <Building2 size={20} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!clients.length && <div className="card p-8 mt-6 text-center text-gray-500">Nenhum cliente disponivel.</div>}

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
