import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardData } from '@/lib/queries';
import PageLoader from '@/components/PageLoader';
import { DashboardData, ProjectUpdate, Sprint } from '@/types/domain';
import { Ticket, FolderOpen, FileText, BarChart3, Clock, CheckCircle2, AlertTriangle, Milestone } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.clientId && user?.role === 'client') return;
    const clientId = user?.clientId || 1;
    getDashboardData(clientId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageLoader />;

  const progressPercent = data?.sprintProgress.total ? Math.round((data.sprintProgress.completed / data.sprintProgress.total) * 100) : 0;

  const typeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <Milestone size={16} className="text-wayzen-500" />;
      case 'alert': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'delivery': return <CheckCircle2 size={16} className="text-green-500" />;
      default: return <Clock size={16} className="text-blue-500" />;
    }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case 'milestone': return 'badge-purple';
      case 'alert': return 'badge-yellow';
      case 'delivery': return 'badge-green';
      default: return 'badge-blue';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Olá, {user?.name}!</h1>
        <p className="text-gray-500 mt-1">
          {data?.client ? `Acompanhe o progresso do projeto de ${data.client.company_name}` : 'Bem-vindo ao Portal do Cliente Wayzen'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tickets Abertos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data?.openTickets || 0}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Ticket size={20} className="text-orange-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Documentos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data?.totalDocuments || 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Relatórios</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data?.totalReports || 0}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Progresso Sprint</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{progressPercent}%</p>
            </div>
            <div className="w-10 h-10 bg-wayzen-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-wayzen-600" />
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-wayzen-500 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Updates */}
        <div className="card">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Atualizações Recentes</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data?.recentUpdates?.length ? data.recentUpdates.map((update: ProjectUpdate) => (
              <div key={update.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  {typeIcon(update.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{update.title}</h3>
                      <span className={`badge ${typeBadge(update.type)}`}>
                        {update.type === 'milestone' ? 'Marco' : update.type === 'alert' ? 'Alerta' : update.type === 'delivery' ? 'Entrega' : 'Atualização'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{update.content}</p>
                    <p className="text-xs text-gray-400 mt-1">por {update.author_name} • {new Date(update.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-400">Nenhuma atualização ainda</div>
            )}
          </div>
        </div>

        {/* Active Sprints */}
        <div className="card">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sprints Ativos</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data?.activeSprints?.length ? data.activeSprints.map((sprint: Sprint) => (
              <div key={sprint.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">{sprint.name}</h3>
                  <span className="badge badge-blue">Em progresso</span>
                </div>
                <p className="text-xs text-gray-500">
                  {sprint.start_date && sprint.end_date && `${new Date(sprint.start_date).toLocaleDateString('pt-BR')} - ${new Date(sprint.end_date).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-400">Nenhum sprint ativo</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
