import { useEffect, useState } from 'react';
import { usePortalScope } from '@/hooks/usePortalScope';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import { Sprint, SprintTask } from '@/types/domain';
import { CalendarDays, Check, CheckCircle2, Circle, Edit2, Plus, X } from 'lucide-react';

export default function Sprints() {
  const { isInternal, activeClientId, activeClient, loadingClients } = usePortalScope();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Record<number, SprintTask[]>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  // New sprint form (internal only)
  const [newSprint, setNewSprint] = useState({ name: '', weekNumber: 1, startDate: '', endDate: '', notes: '' });

  // Sprint inline edit
  const [editingSprintId, setEditingSprintId] = useState<number | null>(null);
  const [editSprintForm, setEditSprintForm] = useState({ name: '', startDate: '', endDate: '', notes: '' });

  // Task inline edit
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');

  // New task form per sprint
  const [addingTaskToSprint, setAddingTaskToSprint] = useState<number | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    portalService.getSprints(activeClientId)
      .then((data) => setSprints(data as Sprint[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeClientId, loadingClients]);

  const loadSprintTasks = async (sprintId: number) => {
    if (tasks[sprintId]) return;
    const data = await portalService.getSprintTasks(sprintId);
    setTasks((prev) => ({ ...prev, [sprintId]: data }));
  };

  const toggleSprint = (sprintId: number) => {
    const next = !expanded[sprintId];
    setExpanded((prev) => ({ ...prev, [sprintId]: next }));
    if (next) loadSprintTasks(sprintId).catch(console.error);
  };

  const addSprint = async () => {
    if (!activeClientId || !newSprint.name.trim()) return;
    await portalService.createSprint({
      clientId: activeClientId,
      name: newSprint.name.trim(),
      weekNumber: Number(newSprint.weekNumber) || 1,
      startDate: newSprint.startDate || undefined,
      endDate: newSprint.endDate || undefined,
      notes: newSprint.notes || undefined,
    });
    const data = await portalService.getSprints(activeClientId);
    setSprints(data as Sprint[]);
    setNewSprint({ name: '', weekNumber: 1, startDate: '', endDate: '', notes: '' });
  };

  const startEditSprint = (sprint: Sprint) => {
    setEditingSprintId(sprint.id);
    setEditSprintForm({
      name: sprint.name,
      startDate: sprint.start_date || '',
      endDate: sprint.end_date || '',
      notes: sprint.notes || '',
    });
  };

  const saveEditSprint = async (sprintId: number) => {
    if (!activeClientId || !editSprintForm.name.trim()) return;
    await portalService.updateSprint(sprintId, {
      clientId: activeClientId,
      name: editSprintForm.name.trim(),
      startDate: editSprintForm.startDate || undefined,
      endDate: editSprintForm.endDate || undefined,
      notes: editSprintForm.notes || undefined,
    });
    const data = await portalService.getSprints(activeClientId);
    setSprints(data as Sprint[]);
    setEditingSprintId(null);
  };

  const toggleTask = async (sprintId: number, taskId: number, current: boolean) => {
    await portalService.updateSprintTask(taskId, { isCompleted: !current });
    setTasks((prev) => ({
      ...prev,
      [sprintId]: (prev[sprintId] || []).map((t) =>
        t.id === taskId ? { ...t, is_completed: !current } : t
      ),
    }));
  };

  const startEditTask = (task: SprintTask) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
  };

  const saveEditTask = async (sprintId: number, taskId: number) => {
    if (!editTaskTitle.trim()) { setEditingTaskId(null); return; }
    await portalService.updateSprintTask(taskId, { title: editTaskTitle.trim() });
    setTasks((prev) => ({
      ...prev,
      [sprintId]: (prev[sprintId] || []).map((t) =>
        t.id === taskId ? { ...t, title: editTaskTitle.trim() } : t
      ),
    }));
    setEditingTaskId(null);
  };

  const addTaskToSprint = async (sprintId: number) => {
    if (!newTask.title.trim()) return;
    await portalService.createSprintTask({
      sprintId,
      title: newTask.title.trim(),
      description: newTask.description,
    });
    const data = await portalService.getSprintTasks(sprintId);
    setTasks((prev) => ({ ...prev, [sprintId]: data }));
    setNewTask({ title: '', description: '' });
    setAddingTaskToSprint(null);
  };

  if (loading || loadingClients) return <PageLoader />;

  if (!activeClientId) {
    return <div className="card p-8 text-center text-gray-500 dark:text-slate-400">Selecione um portal para acompanhar as sprints.</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          {isInternal ? 'Sprints do Projeto' : 'Cronograma de Sprints'}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          {isInternal
            ? `Planejamento e acompanhamento de atividades para ${activeClient?.company_name || ''}`
            : 'Visao macro do cronograma e evolucao do projeto'}
        </p>
      </div>

      {isInternal && (
        <div className="card p-4 mb-4">
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
              type="number" min={1}
              className="input-field"
              placeholder="Semana"
            />
            <input
              value={newSprint.startDate}
              onChange={(e) => setNewSprint((prev) => ({ ...prev, startDate: e.target.value }))}
              type="date" className="input-field"
            />
            <input
              value={newSprint.endDate}
              onChange={(e) => setNewSprint((prev) => ({ ...prev, endDate: e.target.value }))}
              type="date" className="input-field"
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
          const completedTasks = sprintTasks.filter((t) => t.is_completed).length;
          const totalTasks = sprintTasks.length;
          const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const isEditing = editingSprintId === sprint.id;

          return (
            <div key={sprint.id} className="card overflow-hidden">
              {isEditing ? (
                <div className="p-5 space-y-3">
                  <input
                    value={editSprintForm.name}
                    onChange={(e) => setEditSprintForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field font-semibold"
                    placeholder="Editar nome da sprint"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={editSprintForm.startDate}
                      onChange={(e) => setEditSprintForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="input-field" />
                    <input type="date" value={editSprintForm.endDate}
                      onChange={(e) => setEditSprintForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="input-field" />
                  </div>
                  <textarea
                    value={editSprintForm.notes}
                    onChange={(e) => setEditSprintForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="input-field h-20"
                    placeholder="Notas da sprint"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEditSprint(sprint.id)} className="btn-primary">Salvar</button>
                    <button onClick={() => setEditingSprintId(null)} className="btn-secondary"><X size={14} /> Cancelar</button>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800"
                  onClick={() => toggleSprint(sprint.id)}
                >
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{sprint.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <CalendarDays size={12} />
                      {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString('pt-BR') : '-'} ate{' '}
                      {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-wayzen-700 dark:text-wayzen-300">{progress}%</span>
                    {isInternal && (
                      <button
                        onClick={(e) => { e.stopPropagation(); startEditSprint(sprint); }}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500"
                        aria-label="Editar sprint"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                </button>
              )}

              {expanded[sprint.id] && !isEditing && (
                <div className="border-t border-gray-200 dark:border-slate-700 p-5 bg-gray-50 dark:bg-slate-800">
                  {totalTasks > 0 && (
                    <>
                      <div className="mb-2 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700">
                        <div
                          className="h-1.5 rounded-full bg-emerald-400 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
                        {completedTasks} de {totalTasks} atividades concluidas ({progress}%)
                      </p>
                    </>
                  )}

                  <div className="space-y-2">
                    {sprintTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 flex items-center gap-3"
                      >
                        <button
                          onClick={() => toggleTask(sprint.id, task.id, task.is_completed)}
                          className="shrink-0"
                          aria-label={task.is_completed ? 'Desmarcar como concluida' : 'Marcar como concluida'}
                        >
                          {task.is_completed
                            ? <CheckCircle2 size={17} className="text-emerald-500" />
                            : <Circle size={17} className="text-gray-300 dark:text-slate-600 hover:text-wayzen-400 transition-colors" />
                          }
                        </button>

                        {editingTaskId === task.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              autoFocus
                              value={editTaskTitle}
                              onChange={(e) => setEditTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditTask(sprint.id, task.id);
                                if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                              className="input-field py-1 text-sm flex-1"
                            />
                            <button onClick={() => saveEditTask(sprint.id, task.id)} className="btn-primary py-1 px-2">
                              <Check size={13} />
                            </button>
                            <button onClick={() => setEditingTaskId(null)} className="btn-secondary py-1 px-2">
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span
                              className={`flex-1 text-sm ${task.is_completed ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-200'}`}
                            >
                              {task.title}
                            </span>
                            {isInternal && (
                              <button
                                onClick={() => startEditTask(task)}
                                className="shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors"
                                aria-label="Editar atividade"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}

                    {!sprintTasks.length && (
                      <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma atividade cadastrada para esta sprint.</p>
                    )}
                  </div>

                  {isInternal && (
                    <div className="mt-4">
                      {addingTaskToSprint === sprint.id ? (
                        <div className="space-y-2">
                          <input
                            autoFocus
                            value={newTask.title}
                            onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') addTaskToSprint(sprint.id); }}
                            className="input-field"
                            placeholder="Titulo da atividade"
                          />
                          <textarea
                            value={newTask.description}
                            onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                            className="input-field h-16"
                            placeholder="Descricao (opcional)"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => addTaskToSprint(sprint.id)} className="btn-primary">Adicionar</button>
                            <button onClick={() => { setAddingTaskToSprint(null); setNewTask({ title: '', description: '' }); }} className="btn-secondary">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingTaskToSprint(sprint.id)}
                          className="btn-secondary text-sm w-full justify-center"
                        >
                          <Plus size={14} /> Nova atividade
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!sprints.length && (
          <div className="card p-10 text-center text-gray-400 dark:text-slate-500">
            {isInternal ? 'Nenhuma sprint criada ainda. Crie a primeira sprint acima.' : 'Nenhuma sprint encontrada para este cliente.'}
          </div>
        )}
      </div>
    </div>
  );
}
