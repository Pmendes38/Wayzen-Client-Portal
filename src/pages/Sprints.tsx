import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import { Sprint, SprintTask } from '@/types/domain';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Calendar } from 'lucide-react';

export default function Sprints() {
  const { user } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Record<number, SprintTask[]>>({});
  const [tasksLoaded, setTasksLoaded] = useState<Record<number, boolean>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  const clientId = user?.clientId || 1;

  useEffect(() => {
    portalService.getSprints(clientId)
      .then(data => {
        setSprints(data);
        const firstActive = data.find((s: Sprint) => s.status === 'in_progress');
        if (firstActive) setExpanded({ [firstActive.id]: true });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  const loadTasks = async (sprintId: number) => {
    if (tasksLoaded[sprintId]) return;
    const data = await portalService.getSprintTasks(sprintId);
    setTasks(prev => ({ ...prev, [sprintId]: data }));
    setTasksLoaded(prev => ({ ...prev, [sprintId]: true }));
  };

  const toggleExpand = (sprintId: number) => {
    const isExpanding = !expanded[sprintId];
    setExpanded(prev => ({ ...prev, [sprintId]: isExpanding }));
    if (isExpanding) loadTasks(sprintId);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-green';
      case 'in_progress': return 'badge-blue';
      default: return 'badge-gray';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in_progress': return 'Em Progresso';
      default: return 'Planejado';
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Acompanhamento de Sprints</h1>
        <p className="text-gray-500 mt-1">Visualize o progresso das entregas do seu projeto</p>
      </div>

      <div className="space-y-4">
        {sprints.map(sprint => {
          const sprintTasks = tasks[sprint.id] || [];
          const completedTasks = sprintTasks.filter((t: SprintTask) => t.is_completed).length;
          const totalTasks = sprintTasks.length;
          const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div key={sprint.id} className="card overflow-hidden">
              <button onClick={() => toggleExpand(sprint.id)} className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {expanded[sprint.id] ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {sprint.start_date ? `${new Date(sprint.start_date).toLocaleDateString('pt-BR')} - ${new Date(sprint.end_date).toLocaleDateString('pt-BR')}` : 'Sem datas'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {totalTasks > 0 && (
                    <span className="text-sm text-gray-500">{completedTasks}/{totalTasks}</span>
                  )}
                  <span className={`badge ${statusBadge(sprint.status)}`}>{statusLabel(sprint.status)}</span>
                </div>
              </button>

              {expanded[sprint.id] && (
                <div className="border-t border-gray-200 p-5 bg-gray-50">
                  {totalTasks > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progresso</span>
                        <span className="font-medium text-wayzen-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-wayzen-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {sprintTasks.length ? sprintTasks.map((task: SprintTask) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        {task.is_completed ? (
                          <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle size={18} className="text-gray-300 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {task.title}
                        </span>
                      </div>
                    )) : !tasksLoaded[sprint.id] ? (
                      <p className="text-sm text-gray-400 text-center py-4">Carregando tarefas...</p>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">Nenhuma tarefa cadastrada</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!sprints.length && (
          <div className="card p-12 text-center">
            <p className="text-gray-400">Nenhum sprint encontrado para este projeto</p>
          </div>
        )}
      </div>
    </div>
  );
}
