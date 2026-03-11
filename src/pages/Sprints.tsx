import { useEffect, useMemo, useState } from 'react';
import { usePortalScope } from '@/hooks/usePortalScope';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import { Sprint, SprintBacklogItem, SprintTask } from '@/types/domain';
import { CalendarDays, CheckCircle2, Circle, ClipboardList, GripVertical, Plus, UserCircle2 } from 'lucide-react';

type ViewMode = 'kanban' | 'sprints';
type KanbanColumn = 'backlog' | 'todo' | 'doing' | 'finished';

const KANBAN_COLUMNS: Array<{ id: KanbanColumn; title: string; tone: string }> = [
  { id: 'backlog', title: 'BACKLOG', tone: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700/50' },
  { id: 'todo', title: 'TO DO', tone: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:border-slate-700/80' },
  { id: 'doing', title: 'DOING', tone: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-200 dark:border-amber-700/40' },
  { id: 'finished', title: 'FINISHED', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/40' },
];

export default function Sprints() {
  const { isInternal, activeClientId, activeClient, loadingClients } = usePortalScope();
  const [viewMode, setViewMode] = useState<ViewMode>(isInternal ? 'kanban' : 'sprints');
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlog, setBacklog] = useState<SprintBacklogItem[]>([]);
  const [tasks, setTasks] = useState<Record<number, SprintTask[]>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [newSprint, setNewSprint] = useState({ name: '', weekNumber: 1, startDate: '', endDate: '', notes: '' });
  const [newBacklog, setNewBacklog] = useState({ title: '', details: '', dueDate: '' });
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setViewMode(isInternal ? 'kanban' : 'sprints');
  }, [isInternal]);

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    Promise.all([
      portalService.getSprints(activeClientId),
      isInternal ? portalService.getSprintBacklog(activeClientId) : Promise.resolve([]),
    ])
      .then(([sprintsData, backlogData]) => {
        setSprints(sprintsData as Sprint[]);
        setBacklog(backlogData as SprintBacklogItem[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeClientId, isInternal, loadingClients]);

  const clientId = activeClientId;

  const defaultSprintId = useMemo(() => {
    const inProgress = sprints.find((s) => s.status === 'in_progress')?.id;
    return inProgress || sprints[0]?.id || null;
  }, [sprints]);

  const backlogColumns = useMemo(() => {
    return backlog.reduce((acc: Record<KanbanColumn, SprintBacklogItem[]>, item) => {
      const column: KanbanColumn = item.status === 'done'
        ? 'finished'
        : item.status === 'in_progress'
          ? 'doing'
          : item.sprint_id
            ? 'todo'
            : 'backlog';
      acc[column].push(item);
      return acc;
    }, { backlog: [], todo: [], doing: [], finished: [] });
  }, [backlog]);

  const loadSprintTasks = async (sprintId: number) => {
    if (tasks[sprintId]) return;
    const data = await portalService.getSprintTasks(sprintId);
    setTasks((prev) => ({ ...prev, [sprintId]: data }));
  };

  const toggleSprint = (sprintId: number) => {
    const next = !expanded[sprintId];
    setExpanded((prev) => ({ ...prev, [sprintId]: next }));
    if (next) loadSprintTasks(sprintId);
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

    const data = await portalService.getSprints(clientId);
    setSprints(data as Sprint[]);
    setNewSprint({ name: '', weekNumber: 1, startDate: '', endDate: '', notes: '' });
  };

  const addBacklogItem = async () => {
    if (!clientId || !newBacklog.title.trim()) return;

    await portalService.createSprintBacklogItem({
      clientId,
      title: newBacklog.title.trim(),
      details: newBacklog.details,
      dueDate: newBacklog.dueDate || undefined,
      occurredOn: new Date().toISOString().slice(0, 10),
      sprintId: null,
    });

    const data = await portalService.getSprintBacklog(clientId);
    setBacklog(data as SprintBacklogItem[]);
    setNewBacklog({ title: '', details: '', dueDate: '' });
  };

  const moveBacklogCard = async (itemId: number, targetColumn: KanbanColumn) => {
    const target = backlog.find((item) => item.id === itemId);
    if (!target) return;

    const updates: { status?: 'planned' | 'in_progress' | 'done'; sprintId?: number | null } = {};

    if (targetColumn === 'backlog') {
      updates.status = 'planned';
      updates.sprintId = null;
    }

    if (targetColumn === 'todo') {
      updates.status = 'planned';
      updates.sprintId = target.sprint_id || defaultSprintId;
    }

    if (targetColumn === 'doing') {
      updates.status = 'in_progress';
      updates.sprintId = target.sprint_id || defaultSprintId;
    }

    if (targetColumn === 'finished') {
      updates.status = 'done';
      updates.sprintId = target.sprint_id || defaultSprintId;
    }

    await portalService.updateSprintBacklogItem(itemId, updates);

    setBacklog((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        status: updates.status || item.status,
        sprint_id: updates.sprintId === undefined ? item.sprint_id : updates.sprintId,
      };
    }));
  };

  if (loading || loadingClients) return <PageLoader />;

  if (!clientId) {
    return <div className="card p-8 text-center text-gray-500 dark:text-slate-400">Selecione um portal para acompanhar as sprints.</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          {isInternal ? 'Gestao de Backlog e Sprints' : 'Cronograma de Sprints'}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          {isInternal
            ? `Backlog no estilo kanban para ${activeClient?.company_name || ''}`
            : 'Visao macro do cronograma e evolucao do projeto'}
        </p>
      </div>

      {isInternal && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button
            className={`btn-secondary ${viewMode === 'kanban' ? '!bg-slate-900 !text-white !border-slate-900' : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            <ClipboardList size={16} /> Backlog (Kanban)
          </button>
          <button
            className={`btn-secondary ${viewMode === 'sprints' ? '!bg-slate-900 !text-white !border-slate-900' : ''}`}
            onClick={() => setViewMode('sprints')}
          >
            <CalendarDays size={16} /> Sprints (Visao Macro)
          </button>
        </div>
      )}

      {(viewMode === 'kanban' && isInternal) && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <input
                className="input-field dark:!bg-slate-800 dark:!text-slate-100 dark:!border-slate-700"
                placeholder="Nova tarefa de backlog"
                value={newBacklog.title}
                onChange={(e) => setNewBacklog((prev) => ({ ...prev, title: e.target.value }))}
              />
              <input
                type="date"
                className="input-field dark:!bg-slate-800 dark:!text-slate-100 dark:!border-slate-700"
                value={newBacklog.dueDate}
                onChange={(e) => setNewBacklog((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
              <button className="btn-primary justify-center" onClick={addBacklogItem}>
                <Plus size={16} /> Adicionar
              </button>
            </div>
            <textarea
              className="input-field mt-3 h-20 dark:!bg-slate-800 dark:!text-slate-100 dark:!border-slate-700"
              placeholder="Descricao da atividade"
              value={newBacklog.details}
              onChange={(e) => setNewBacklog((prev) => ({ ...prev, details: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {KANBAN_COLUMNS.map((column) => (
              <div
                key={column.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 min-h-[520px] dark:border-slate-700 dark:bg-slate-900"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async () => {
                  if (!draggingId) return;
                  await moveBacklogCard(draggingId, column.id);
                  setDraggingId(null);
                }}
              >
                <div className={`mx-3 mt-3 rounded-lg border px-3 py-2 flex items-center justify-between ${column.tone}`}>
                  <p className="text-sm font-bold tracking-wide">{column.title}</p>
                  <span className="text-xs font-semibold opacity-90">{backlogColumns[column.id].length}</span>
                </div>

                <div className="p-3 space-y-3">
                  {backlogColumns[column.id].map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDraggingId(item.id)}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <GripVertical size={14} className="text-slate-500 mt-1" />
                          <p className="text-slate-900 dark:text-slate-100 font-semibold text-sm leading-5">{item.title}</p>
                        </div>
                      </div>

                      {item.details && <p className="text-xs text-slate-500 dark:text-slate-300 mt-2 line-clamp-3">{item.details}</p>}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                          <UserCircle2 size={15} />
                          <span>{item.created_by_name || 'Time Wayzen'}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-300">
                          {item.due_date ? new Date(item.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                          <Circle size={13} />
                        </span>
                        <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                          <CalendarDays size={13} />
                        </span>
                        <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                          <CheckCircle2 size={13} />
                        </span>
                      </div>
                    </div>
                  ))}

                  {!backlogColumns[column.id].length && (
                    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      Arraste tarefas para esta coluna.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(viewMode === 'sprints' || !isInternal) && (
        <div className="space-y-4">
          {isInternal && (
            <div className="card p-4 mb-2">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Nova Sprint</h2>
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

          {sprints.map((sprint) => {
            const sprintTasks = tasks[sprint.id] || [];
            const completedTasks = sprintTasks.filter((task) => task.is_completed).length;
            const totalTasks = sprintTasks.length;
            const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div key={sprint.id} className="card overflow-hidden">
                <button
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800"
                  onClick={() => toggleSprint(sprint.id)}
                >
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{sprint.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString('pt-BR') : '-'} ate{' '}
                      {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-wayzen-700 dark:text-wayzen-300">{progress}%</span>
                </button>

                {expanded[sprint.id] && (
                  <div className="border-t border-gray-200 dark:border-slate-700 p-5 bg-gray-50 dark:bg-slate-800">
                    {!sprintTasks.length ? (
                      <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma atividade carregada para esta sprint.</p>
                    ) : (
                      <div className="space-y-2">
                        {sprintTasks.map((task) => (
                          <div key={task.id} className="rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3">
                            <p className={`text-sm ${task.is_completed ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-200'}`}>{task.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!sprints.length && (
            <div className="card p-10 text-center text-gray-400 dark:text-slate-500">Nenhuma sprint encontrada para este cliente.</div>
          )}
        </div>
      )}
    </div>
  );
}
