import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import { SharedReport } from '@/types/domain';
import { FileText, Calendar, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<SharedReport[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const clientId = user?.clientId || 1;

  useEffect(() => {
    portalService.getReports(clientId)
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 mt-1">Relatórios de desempenho do seu projeto</p>
      </div>

      <div className="space-y-4">
        {reports.map(report => (
          <div key={report.id} className="card overflow-hidden">
            <button onClick={() => setExpanded(expanded === report.id ? null : report.id)} className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-wayzen-100 rounded-lg flex items-center justify-center">
                  <BarChart3 size={20} className="text-wayzen-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`badge ${report.type === 'weekly' ? 'badge-blue' : 'badge-purple'}`}>
                      {report.type === 'weekly' ? 'Semanal' : 'Mensal'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} />
                      {new Date(report.period_start).toLocaleDateString('pt-BR')} - {new Date(report.period_end).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
              {expanded === report.id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
            </button>
            {expanded === report.id && (
              <div className="border-t border-gray-200 p-5 bg-gray-50">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 text-sm">{report.content || 'Sem conteúdo detalhado.'}</div>
                </div>
                {report.metrics && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Métricas</h4>
                    <pre className="text-xs bg-white p-3 rounded-lg border border-gray-200 overflow-auto">{report.metrics}</pre>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3">por {report.author_name} • {new Date(report.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
          </div>
        ))}

        {!reports.length && (
          <div className="card p-12 text-center">
            <FileText size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum relatório disponível ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
