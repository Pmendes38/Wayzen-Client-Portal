import { usePortalScope } from '@/hooks/usePortalScope';
import { Building2, CheckCircle2 } from 'lucide-react';
import PageLoader from '@/components/PageLoader';

export default function ClientPortals() {
  const { isInternal, clients, activeClientId, setActiveClientId, loadingClients } = usePortalScope();

  if (loadingClients) return <PageLoader />;

  if (!isInternal) {
    return (
      <div className="card p-8 text-center text-gray-500">
        Esta area e exclusiva para o time interno.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Portais de Clientes</h1>
        <p className="text-gray-500 mt-1">Selecione o cliente em foco para editar backlog, sprints, relatorios e operacao diaria.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              <p className="text-xs text-gray-500 mt-4">
                {selected ? 'Portal selecionado para trabalho atual.' : 'Clique para assumir este portal no contexto interno.'}
              </p>
            </button>
          );
        })}
      </div>

      {!clients.length && <div className="card p-8 text-center text-gray-500">Nenhum cliente disponivel.</div>}
    </div>
  );
}
