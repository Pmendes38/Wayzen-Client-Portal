import { useEffect, useState } from 'react';
import { usePortalScope } from '@/hooks/usePortalScope';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import ActivityEditorPanel, {
  ActivityEditorSyncState,
  ActivityEditorValue,
} from '@/components/ActivityEditorPanel';
import { Sprint, SprintTask } from '@/types/domain';
import { CalendarDays, CheckCircle2, Circle, Edit2, Link2, Paperclip, Plus, Trash2, X } from 'lucide-react';

type TaskEditorState =
  | { mode: 'create'; sprintId: number }
  | { mode: 'edit'; sprintId: number; task: SprintTask }
  | null;

function buildTaskEditorValue(sprintId: number, task?: SprintTask): ActivityEditorValue {
  return {
    title: task?.title || '',
    description: task?.description || '',
    contextNotes: task?.context_notes || '',
    sprintId: String(task?.sprint_id || sprintId),
    occurredOn: '',
    startDate: task?.start_date || '',
    endDate: task?.end_date || '',
    dueDate: task?.due_date || '',
    subtasks: task?.subtasks || [],
    attachments: task?.attachments || [],
  };
}

function getTaskBadgeData(task: SprintTask) {
  return {
    subtaskCount: task.subtasks?.length || 0,
    completedSubtasks: (task.subtasks || []).filter((subtask) => subtask.done).length,
    attachmentCount: task.attachments?.length || 0,
    isLinked: Boolean(task.backlog_item_id),
  };
}

export default function Sprints() {
  const { isInternal, activeClientId, activeClient, loadingClients } = usePortalScope();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Record<number, SprintTask[]>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<ActivityEditorSyncState>('idle');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [newSprint, setNewSprint] = useState({ name: '', weekNumber: 1, startDate: '', endDate: '', notes: '' });
  const [editingSprintId, setEditingSprintId] = useState<number | null>(null);
  const [editSprintForm, setEditSprintForm] = useState({ name: '', startDate: '', endDate: '', notes: '' });
  const [taskEditorState, setTaskEditorState] = useState<TaskEditorState>(null);

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

  const refreshSprints = async () => {
    if (!activeClientId) return;
    const data = await portalService.getSprints(activeClientId);
    setSprints(data as Sprint[]);
  };

  const loadSprintTasks = async (sprintId: number, force = false) => {
    if (!force && tasks[sprintId]) return;
    const data = await portalService.getSprintTasks(sprintId);
    setTasks((prev) => ({ ...prev, [sprintId]: data }));
  };

  const showSyncNotice = (message: string) => {
    setSyncNotice(message);
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
    await refreshSprints();
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
    await refreshSprints();
    setEditingSprintId(null);
  };

  const toggleTask = async (sprintId: number, task: SprintTask) => {
    setSyncState('syncing');
    try {
      await portalService.updateSprintTask(task.id, {
        isCompleted: !task.is_completed,
        clientId: activeClientId || undefined,
      });
      await loadSprintTasks(sprintId, true);
      showSyncNotice('Atualizado no Kanban');
    } catch (error) {
      console.error(error);
      showSyncNotice(`Erro: ${error instanceof Error ? error.message : 'Falha ao concluir atividade'}`);
    } finally {
      setSyncState('idle');
    }
  };

  const removeSprint = async (sprintId: number) => {
    if (!isInternal || !activeClientId) return;
    await portalService.deleteSprint(sprintId);
    await refreshSprints();
    setTasks((prev) => {
      const next = { ...prev };
      delete next[sprintId];
      return next;
    });
    setExpanded((prev) => {
      const next = { ...prev };
      delete next[sprintId];
      return next;
    });
  };

  const removeTask = async (sprintId: number, taskId: number) => {
    if (!isInternal) return;
    setSyncState('syncing');
    try {
      await portalService.deleteSprintTask(taskId);
      await loadSprintTasks(sprintId, true);
      showSyncNotice('Atualizado no Kanban');
    } catch (error) {
      console.error(error);
    } finally {
      setSyncState('idle');
    }
  };

  const saveTaskFromEditor = async (values: ActivityEditorValue) => {
    if (!taskEditorState || !activeClientId) return;

    setSyncState('saving');

    try {
      if (taskEditorState.mode === 'create') {
        const backlogItem = await portalService.createSprintBacklogItem({
          clientId: activeClientId,
          sprintId: taskEditorState.sprintId,
          title: values.title.trim(),
          details: values.description || undefined,
          contextNotes: values.contextNotes || undefined,
          subtasks: values.subtasks,
          attachments: values.attachments,
          occurredOn: values.startDate || new Date().toISOString().slice(0, 10),
          dueDate: values.dueDate || undefined,
        });

        setSyncState('syncing');

        await portalService.createSprintTask({
          sprintId: taskEditorState.sprintId,
          backlogItemId: (backlogItem as { id: number }).id,
          title: values.title.trim(),
          description: values.description || undefined,
          contextNotes: values.contextNotes || undefined,
          subtasks: values.subtasks,
          attachments: values.attachments,
          startDate: values.startDate || undefined,
          endDate: values.endDate || undefined,
          dueDate: values.dueDate || undefined,
        });

        await loadSprintTasks(taskEditorState.sprintId, true);
      } else {
        await portalService.updateSprintTask(taskEditorState.task.id, {
          title: values.title.trim(),
          description: values.description || undefined,
          contextNotes: values.contextNotes || undefined,
          subtasks: values.subtasks,
          attachments: values.attachments,
          dueDate: values.dueDate || undefined,
          endDate: values.endDate || undefined,
          clientId: activeClientId,
        });

        setSyncState('syncing');
        await loadSprintTasks(taskEditorState.sprintId, true);
      }

      setExpanded((prev) => ({ ...prev, [taskEditorState.sprintId]: true }));
      setTaskEditorState(null);
      showSyncNotice('Atualizado no Kanban');
    } catch (err) {
      console.error(err);
      showSyncNotice(`Erro: ${err instanceof Error ? err.message : 'Falha ao salvar atividade'}`);
    } finally {
      setSyncState('idle');
    }
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

      {syncNotice && (
        <div className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${
          syncNotice.startsWith('Erro:')
            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300'
        }`}>
          <span>{syncNotice}</span>
          <button type="button" onClick={() => setSyncNotice(null)} className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={14} />
          </button>
        </div>
      )}

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
          const completedTasks = sprintTasks.filter((task) => task.is_completed).length;
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
                    <input
                      type="date"
                      value={editSprintForm.startDate}
                      onChange={(e) => setEditSprintForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="input-field"
                    />
                    <input
                      type="date"
                      value={editSprintForm.endDate}
                      onChange={(e) => setEditSprintForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="input-field"
                    />
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
                <div
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => toggleSprint(sprint.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleSprint(sprint.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
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
                      <>
                        <button
                          onClick={(event) => { event.stopPropagation(); startEditSprint(sprint); }}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500"
                          aria-label="Editar sprint"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(event) => { event.stopPropagation(); removeSprint(sprint.id).catch(console.error); }}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                          aria-label="Excluir sprint"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {expanded[sprint.id] && !isEditing && (
                <div className="border-t border-gray-200 dark:border-slate-700 p-5 bg-gray-50 dark:bg-slate-800">
                  {totalTasks > 0 && (
                    <>
                      <div className="mb-2 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700">
                        <div className="h-1.5 rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
                        {completedTasks} de {totalTasks} atividades concluidas ({progress}%)
                      </p>
                    </>
                  )}

                  <div className="space-y-3">
                    {sprintTasks.map((task) => {
                      const badgeData = getTaskBadgeData(task);

                      return (
                        <div key={task.id} className="rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-4">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleTask(sprint.id, task).catch(console.error)}
                              className="shrink-0 mt-1"
                              disabled={syncState !== 'idle'}
                              aria-label={task.is_completed ? 'Desmarcar como concluida' : 'Marcar como concluida'}
                            >
                              {task.is_completed
                                ? <CheckCircle2 size={17} className="text-emerald-500" />
                                : <Circle size={17} className="text-gray-300 dark:text-slate-600 hover:text-wayzen-400 transition-colors" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className={`text-sm font-semibold ${task.is_completed ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-100'}`}>
                                    {task.title}
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {badgeData.isLinked && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-wayzen-50 px-2.5 py-1 text-[11px] font-semibold text-wayzen-700 dark:bg-wayzen-900/30 dark:text-wayzen-300">
                                        <Link2 size={12} /> Sincronizada com Kanban
                                      </span>
                                    )}
                                    {task.due_date && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        <CalendarDays size={12} /> {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                      </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {badgeData.completedSubtasks}/{badgeData.subtaskCount} subtarefas
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      <Paperclip size={11} /> {badgeData.attachmentCount} anexos
                                    </span>
                                  </div>
                                </div>

                                {isInternal && (
                                  <div className="shrink-0 flex items-center gap-1">
                                    <button
                                      onClick={() => setTaskEditorState({ mode: 'edit', sprintId: sprint.id, task })}
                                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors"
                                      aria-label="Editar atividade"
                                      disabled={syncState !== 'idle'}
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => removeTask(sprint.id, task.id).catch(console.error)}
                                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                                      aria-label="Excluir atividade"
                                      disabled={syncState !== 'idle'}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {(task.description || task.context_notes) && (
                                <div className="mt-3 space-y-2">
                                  {task.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{task.description}</p>
                                  )}
                                  {task.context_notes && (
                                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {task.context_notes}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!sprintTasks.length && (
                      <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma atividade cadastrada para esta sprint.</p>
                    )}
                  </div>

                  {isInternal && (
                    <div className="mt-4">
                      <button
                        onClick={() => setTaskEditorState({ mode: 'create', sprintId: sprint.id })}
                        className="btn-secondary text-sm w-full justify-center"
                        disabled={syncState !== 'idle'}
                      >
                        <Plus size={14} /> Nova atividade
                      </button>
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

      {taskEditorState && (
        <ActivityEditorPanel
          key={`${taskEditorState.mode}-${taskEditorState.sprintId}-${taskEditorState.mode === 'edit' ? taskEditorState.task.id : 'new'}`}
          isOpen
          kind="task"
          title={taskEditorState.mode === 'create' ? 'Nova atividade da sprint' : 'Editar atividade da sprint'}
          initialValue={buildTaskEditorValue(taskEditorState.sprintId, taskEditorState.mode === 'edit' ? taskEditorState.task : undefined)}
          sprints={sprints}
          saving={syncState === 'saving'}
          syncState={syncState}
          onClose={() => {
            if (syncState !== 'idle') return;
            setTaskEditorState(null);
          }}
          onSave={saveTaskFromEditor}
        />
      )}
    </div>
  );
}