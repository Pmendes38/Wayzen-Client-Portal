import { useEffect, useMemo, useState } from 'react';
import { usePortalScope } from '@/hooks/usePortalScope';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import { Sprint, SprintBacklogItem, SprintTask } from '@/types/domain';
import { Calendar, CheckCircle2, ChevronDown, ChevronRight, Circle, Plus } from 'lucide-react';

type BacklogActivity = SprintTask & { sprint_name?: string };

type ActivityForm = {
  sprintId: number | null;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
};

export default function Sprints() {
  const { isInternal, activeClientId, activeClient, loadingClients } = usePortalScope();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlog, setBacklog] = useState<SprintBacklogItem[]>([]);
  const [backlogActivities, setBacklogActivities] = useState<BacklogActivity[]>([]);
  const [tasks, setTasks] = useState<Record<number, SprintTask[]>>({});
  const [tasksLoaded, setTasksLoaded] = useState<Record<number, boolean>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [newSprint, setNewSprint] = useState({ name: '', weekNumber: 1, startDate: '', endDate: '', notes: '' });
  const [newTaskTitle, setNewTaskTitle] = useState<Record<number, string>>({});
  const [newBacklog, setNewBacklog] = useState({ title: '', details: '', dueDate: '' });
  const [activityFormByBacklogId, setActivityFormByBacklogId] = useState<Record<number, ActivityForm>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    Promise.all([
      portalService.getSprints(activeClientId),
      isInternal ? portalService.getSprintBacklog(activeClientId) : Promise.resolve([]),
      isInternal ? portalService.getBacklogActivities(activeClientId) : Promise.resolve([]),
    ])
      .then(([sprintsData, backlogData, activitiesData]) => {
        setSprints(sprintsData as Sprint[]);
        setBacklog(backlogData as SprintBacklogItem[]);
        setBacklogActivities((activitiesData || []) as BacklogActivity[]);
        const firstActive = (sprintsData as Sprint[]).find((s: Sprint) => s.status === 'in_progress');
        if (firstActive) setExpanded({ [firstActive.id]: true });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeClientId, isInternal, loadingClients]);

  const activitiesByBacklogId = useMemo(() => {
    return backlogActivities.reduce((acc: Record<number, BacklogActivity[]>, activity) => {
      const backlogId = activity.backlog_item_id;
      if (!backlogId) return acc;
      if (!acc[backlogId]) acc[backlogId] = [];
      acc[backlogId].push(activity);
      return acc;
    }, {});
  }, [backlogActivities]);

  const clientId = activeClientId;

  const loadTasks = async (sprintId: number) => {
    if (tasksLoaded[sprintId]) return;
    const data = await portalService.getSprintTasks(sprintId);
    setTasks((prev) => ({ ...prev, [sprintId]: data }));
    setTasksLoaded((prev) => ({ ...prev, [sprintId]: true }));
  };

  const reloadBacklogActivities = async () => {
    if (!clientId || !isInternal) return;
    const updated = await portalService.getBacklogActivities(clientId);
    setBacklogActivities(updated as BacklogActivity[]);
  };

  const toggleExpand = (sprintId: number) => {
    const isExpanding = !expanded[sprintId];
    setExpanded((prev) => ({ ...prev, [sprintId]: isExpanding }));
    if (isExpanding) loadTasks(sprintId);
  };

  const addSprint = async () => {
    if (!clientId || !newSprint.name.trim()) return;
    await portalService.createSprint({
      clientId,
      name: newSprint.name.trim(),
      weekNumber: Number(newSprint.weekNumber) || 1,
      startDate: newSprint.startDate || undefined,
      endDate: newSprint.endDate || undefined,
      notes: newSprint.notes || undefined,
    });

    const refreshed = await portalService.getSprints(clientId);
    setSprints(refreshed as Sprint[]);
    setNewSprint({ name: '', weekNumber: 1, startDate: '', endDate: '', notes: '' });
  };

  const addTask = async (sprintId: number) => {
    const title = (newTaskTitle[sprintId] || '').trim();
    if (!title) return;

    await portalService.createSprintTask({ sprintId, title });
    const updatedTasks = await portalService.getSprintTasks(sprintId);
    setTasks((prev) => ({ ...prev, [sprintId]: updatedTasks }));
    setTasksLoaded((prev) => ({ ...prev, [sprintId]: true }));
    setNewTaskTitle((prev) => ({ ...prev, [sprintId]: '' }));
  };

  const toggleTask = async (task: SprintTask, sprintId: number) => {
    await portalService.updateSprintTask(task.id, { isCompleted: !task.is_completed });
    const updatedTasks = await portalService.getSprintTasks(sprintId);
    setTasks((prev) => ({ ...prev, [sprintId]: updatedTasks }));
    if (task.backlog_item_id) {
      await reloadBacklogActivities();
    }
  };

  const addBacklogItem = async () => {
    if (!clientId || !newBacklog.title.trim()) return;
    await portalService.createSprintBacklogItem({
      clientId,
      title: newBacklog.title,
      details: newBacklog.details,
      dueDate: newBacklog.dueDate || undefined,
      occurredOn: new Date().toISOString().slice(0, 10),
    });

    const refreshed = await portalService.getSprintBacklog(clientId);
    setBacklog(refreshed as SprintBacklogItem[]);
    setNewBacklog({ title: '', details: '', dueDate: '' });
  };

  const updateActivityForm = (backlogId: number, updates: Partial<ActivityForm>) => {
    setActivityFormByBacklogId((prev) => ({
      ...prev,
      [backlogId]: {
        ...(prev[backlogId] || {
          sprintId: null,
          title: '',
          description: '',
          startDate: '',
          endDate: '',
        }),
        ...updates,
      },
    }));
  };

  const linkBacklogToSprint = async (backlogItem: SprintBacklogItem) => {
    const form = activityFormByBacklogId[backlogItem.id];
    if (!form?.sprintId || !form.title.trim()) return;

    await portalService.createSprintTask({
      sprintId: form.sprintId,
      backlogItemId: backlogItem.id,
      title: form.title.trim(),
      description: form.description || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    });

    const updatedTasks = await portalService.getSprintTasks(form.sprintId);
    setTasks((prev) => ({ ...prev, [form.sprintId as number]: updatedTasks }));
    setTasksLoaded((prev) => ({ ...prev, [form.sprintId as number]: true }));

    await reloadBacklogActivities();
    updateActivityForm(backlogItem.id, {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-green';
      case 'in_progress':
        return 'badge-blue';
      default:
        return 'badge-gray';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluido';
      case 'in_progress':
        return 'Em Progresso';
      default:
        return 'Planejado';
    }
  };

  if (loading || loadingClients) return <PageLoader />;

  if (!clientId) {
    return <div className="card p-8 text-center text-gray-500">Selecione um portal para acompanhar as sprints.</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isInternal ? 'Planejamento de Backlog e Sprint' : 'Cronograma de Sprints'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isInternal
            ? `Backlog separado e vinculado atividade por atividade para ${activeClient?.company_name || ''}`
            : 'Visualize o progresso das entregas do seu projeto'}
        </p>
      </div>

      {isInternal && (
        <div className="card p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Nova Sprint</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              value={newSprint.name}
              onChange={(e) => setNewSprint((prev) => ({ ...prev, name: e.target.value }))}
              className="input-field md:col-span-2"
              placeholder="Nome da sprint"
            />
            <input
              value={newSprint.weekNumber}
              onChange={(e) => setNewSprint((prev) => ({ ...prev, weekNumber: Number(e.target.value) || 1 }))}
              type="number"
              min={1}
              className="input-field"
              placeholder="Semana"
            />
            <input
              value={newSprint.startDate}
              onChange={(e) => setNewSprint((prev) => ({ ...prev, startDate: e.target.value }))}
              type="date"
              className="input-field"
            />
            <input
              value={newSprint.endDate}
              onChange={(e) => setNewSprint((prev) => ({ ...prev, endDate: e.target.value }))}
              type="date"
              className="input-field"
            />
          </div>
          <textarea
            value={newSprint.notes}
            onChange={(e) => setNewSprint((prev) => ({ ...prev, notes: e.target.value }))}
            className="input-field mt-3 h-20"
            placeholder="Resumo de execucao e compromissos"
          />
          <button onClick={addSprint} className="btn-primary mt-3 inline-flex items-center gap-2">
            <Plus size={16} /> Criar Sprint
          </button>
        </div>
      )}

      <div className="space-y-4">
        {sprints.map((sprint) => {
          const sprintTasks = tasks[sprint.id] || [];
          const completedTasks = sprintTasks.filter((t: SprintTask) => t.is_completed).length;
          const totalTasks = sprintTasks.length;
          const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div key={sprint.id} className="card overflow-hidden">
              <button
                onClick={() => toggleExpand(sprint.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expanded[sprint.id] ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {sprint.start_date && sprint.end_date
                          ? `${new Date(sprint.start_date).toLocaleDateString('pt-BR')} - ${new Date(sprint.end_date).toLocaleDateString('pt-BR')}`
                          : 'Sem datas'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {totalTasks > 0 && <span className="text-sm text-gray-500">{completedTasks}/{totalTasks}</span>}
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
                        <div
                          className="bg-wayzen-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {sprintTasks.length ? (
                      sprintTasks.map((task: SprintTask) => (
                        <button
                          key={task.id}
                          onClick={() => isInternal && toggleTask(task, sprint.id)}
                          className={`w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 ${isInternal ? 'hover:border-wayzen-300' : ''}`}
                        >
                          {task.is_completed ? (
                            <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle size={18} className="text-gray-300 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="text-left">
                            <p className={`text-sm ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {task.title}
                            </p>
                            {(task.start_date || task.end_date) && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {task.start_date ? new Date(task.start_date).toLocaleDateString('pt-BR') : '-'} ate{' '}
                                {task.end_date ? new Date(task.end_date).toLocaleDateString('pt-BR') : '-'}
                              </p>
                            )}
                            {task.backlog_item_id && (
                              <p className="text-xs text-wayzen-600 mt-0.5">Vinculada ao backlog #{task.backlog_item_id}</p>
                            )}
                          </div>
                        </button>
                      ))
                    ) : !tasksLoaded[sprint.id] ? (
                      <p className="text-sm text-gray-400 text-center py-4">Carregando tarefas...</p>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">Nenhuma tarefa cadastrada</p>
                    )}

                    {isInternal && (
                      <div className="flex gap-2 pt-2">
                        <input
                          value={newTaskTitle[sprint.id] || ''}
                          onChange={(e) => setNewTaskTitle((prev) => ({ ...prev, [sprint.id]: e.target.value }))}
                          className="input-field"
                          placeholder="Adicionar tarefa avulsa da sprint"
                        />
                        <button onClick={() => addTask(sprint.id)} className="btn-secondary whitespace-nowrap">Adicionar</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!sprints.length && (
          <div className="card p-12 text-center">
            <p className="text-gray-400">Nenhuma sprint encontrada para este projeto</p>
          </div>
        )}
      </div>

      {isInternal && (
        <div className="card p-5 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Backlog (separado das atividades da sprint)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={newBacklog.title}
              onChange={(e) => setNewBacklog((prev) => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="Item de backlog"
            />
            <input
              value={newBacklog.dueDate}
              onChange={(e) => setNewBacklog((prev) => ({ ...prev, dueDate: e.target.value }))}
              type="date"
              className="input-field"
            />
            <button onClick={addBacklogItem} className="btn-primary">Registrar no backlog</button>
          </div>
          <textarea
            value={newBacklog.details}
            onChange={(e) => setNewBacklog((prev) => ({ ...prev, details: e.target.value }))}
            className="input-field mt-3 h-20"
            placeholder="Descricao do item de backlog"
          />

          <div className="mt-4 space-y-3">
            {backlog.map((item) => {
              const linkedActivities = activitiesByBacklogId[item.id] || [];
              const form = activityFormByBacklogId[item.id] || {
                sprintId: null,
                title: '',
                description: '',
                startDate: '',
                endDate: '',
              };

              return (
                <div key={item.id} className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="font-medium text-sm text-gray-900">{item.title}</p>
                  {item.details && <p className="text-sm text-gray-600 mt-1">{item.details}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    Inserido em: {item.occurred_on ? new Date(item.occurred_on).toLocaleDateString('pt-BR') : 'nao informado'}
                    {' | '}Termino: {item.due_date ? new Date(item.due_date).toLocaleDateString('pt-BR') : 'nao definido'}
                  </p>

                  <div className="mt-3 space-y-2">
                    {linkedActivities.map((activity) => (
                      <div key={activity.id} className="rounded-lg bg-white border border-gray-200 p-3">
                        <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                        {activity.description && <p className="text-xs text-gray-600 mt-1">{activity.description}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          Sprint: {activity.sprint_name || '-'}
                          {' | '}Inicio: {activity.start_date ? new Date(activity.start_date).toLocaleDateString('pt-BR') : '-'}
                          {' | '}Fim: {activity.end_date ? new Date(activity.end_date).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    ))}
                    {!linkedActivities.length && <p className="text-xs text-gray-400">Ainda sem atividades vinculadas.</p>}
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
                    <select
                      value={form.sprintId || ''}
                      onChange={(e) => updateActivityForm(item.id, { sprintId: e.target.value ? Number(e.target.value) : null })}
                      className="input-field"
                    >
                      <option value="">Selecionar sprint</option>
                      {sprints.map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                      ))}
                    </select>
                    <input
                      value={form.title}
                      onChange={(e) => updateActivityForm(item.id, { title: e.target.value })}
                      className="input-field md:col-span-2"
                      placeholder="Atividade da sprint para este backlog"
                    />
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => updateActivityForm(item.id, { startDate: e.target.value })}
                      className="input-field"
                    />
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => updateActivityForm(item.id, { endDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateActivityForm(item.id, { description: e.target.value })}
                    className="input-field mt-2 h-20"
                    placeholder="Descricao da atividade"
                  />
                  <button onClick={() => linkBacklogToSprint(item)} className="btn-secondary mt-2">
                    Vincular atividade na sprint
                  </button>
                </div>
              );
            })}
            {!backlog.length && <p className="text-sm text-gray-400">Nenhum item no backlog interno.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
