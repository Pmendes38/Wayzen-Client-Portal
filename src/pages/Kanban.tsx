import { useEffect, useMemo, useState } from 'react';
import { usePortalScope } from '@/hooks/usePortalScope';
import { portalService } from '@/lib/services/portal';
import { SprintBacklogItem, Sprint } from '@/types/domain';
import PageLoader from '@/components/PageLoader';
import { Archive, CheckCircle2, Circle, ClipboardList, GripVertical, Plus, UserCircle2 } from 'lucide-react';

type KanbanColumn = 'backlog' | 'todo' | 'doing' | 'finished';
type KanbanView = 'board' | 'registry';
const ARCHIVED_TAG = '[ARQUIVADA]';

const KANBAN_COLUMNS: Array<{ id: KanbanColumn; title: string }> = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing' },
  { id: 'finished', title: 'Finished' },
];

export default function Kanban() {
  const { isInternal, activeClientId, activeClient, loadingClients } = usePortalScope();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlog, setBacklog] = useState<SprintBacklogItem[]>([]);
  const [backlogActivities, setBacklogActivities] = useState<any[]>([]);
  const [newBacklog, setNewBacklog] = useState({ title: '', details: '', dueDate: '' });
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [view, setView] = useState<KanbanView>('board');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId || !isInternal) {
      setLoading(false);
      return;
    }

    Promise.all([
      portalService.getSprints(activeClientId),
      portalService.getSprintBacklog(activeClientId),
      portalService.getBacklogActivities(activeClientId),
    ])
      .then(([sprintsData, backlogData, activitiesData]) => {
        setSprints(sprintsData as Sprint[]);
        setBacklog(backlogData as SprintBacklogItem[]);
        setBacklogActivities((activitiesData || []) as any[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeClientId, isInternal, loadingClients]);

  const isArchived = (item: SprintBacklogItem) => (item.details || '').includes(ARCHIVED_TAG);

  const boardBacklog = useMemo(
    () => backlog.filter((item) => !isArchived(item)),
    [backlog]
  );

  const registryItems = useMemo(
    () => backlog.filter((item) => item.status === 'done' || isArchived(item)),
    [backlog]
  );

  const defaultSprintId = useMemo(() => {
    const inProgress = sprints.find((s) => s.status === 'in_progress')?.id;
    return inProgress || sprints[0]?.id || null;
  }, [sprints]);

  const backlogColumns = useMemo(() => {
    return boardBacklog.reduce((acc: Record<KanbanColumn, SprintBacklogItem[]>, item) => {
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
  }, [boardBacklog]);

  const addBacklogItem = async () => {
    if (!activeClientId || !newBacklog.title.trim()) return;

    await portalService.createSprintBacklogItem({
      clientId: activeClientId,
      title: newBacklog.title.trim(),
      details: newBacklog.details,
      dueDate: newBacklog.dueDate || undefined,
      occurredOn: new Date().toISOString().slice(0, 10),
      sprintId: null,
    });

    const data = await portalService.getSprintBacklog(activeClientId);
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

    await portalService.updateSprintBacklogItem(itemId, {
      ...updates,
      clientId: activeClientId || undefined,
      title: target.title,
      dueDate: target.due_date || undefined,
    });

    setBacklog((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        status: updates.status || item.status,
        sprint_id: updates.sprintId === undefined ? item.sprint_id : updates.sprintId,
      };
    }));

    if (targetColumn === 'finished') {
      setView('registry');
    }
  };

  const archiveBacklogItem = async (item: SprintBacklogItem) => {
    if (!activeClientId) return;

    const details = (item.details || '').includes(ARCHIVED_TAG)
      ? item.details || ''
      : `${ARCHIVED_TAG}\n${item.details || ''}`.trim();

    await portalService.updateSprintBacklogItem(item.id, {
      status: 'done',
      sprintId: item.sprint_id || defaultSprintId,
      clientId: activeClientId,
      title: item.title,
      dueDate: item.due_date || undefined,
      details,
    });

    setBacklog((prev) => prev.map((row) => row.id === item.id ? { ...row, status: 'done', details } : row));
    setView('registry');
  };

  const archiveCompleted = async () => {
    if (!activeClientId) return;
    const completed = backlog.filter((item) => item.status === 'done' && !isArchived(item));
    if (!completed.length) {
      setView('registry');
      return;
    }

    await Promise.all(completed.map((item) => archiveBacklogItem(item)));
    const data = await portalService.getSprintBacklog(activeClientId);
    setBacklog(data as SprintBacklogItem[]);
    setView('registry');
  };

  if (loading || loadingClients) return <PageLoader />;

  if (!activeClientId) {
    return <div className="card p-8 text-center text-gray-500 dark:text-slate-400">Selecione um portal para visualizar o kanban.</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Kanban do Projeto</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Backlog operacional de {activeClient?.company_name || 'cliente'} sincronizado com Sprint.</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
            view === 'board'
              ? 'bg-wayzen-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
          onClick={() => setView('board')}
        >
          <ClipboardList size={15} />
          Quadro Kanban
        </button>
        <button
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
            view === 'registry'
              ? 'bg-wayzen-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
          onClick={() => setView('registry')}
        >
          <Archive size={15} />
          Registro ({registryItems.length})
        </button>
      </div>

      {view === 'registry' ? (
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Demandas concluidas e arquivadas</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Toda atividade concluida ou arquivada fica registrada aqui.</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Demanda</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Prazo</th>
                  <th className="px-4 py-3 text-left">Criado em</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                {registryItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isArchived(item)
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}>
                        {isArchived(item) ? 'Arquivada' : 'Concluida'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.due_date ? new Date(item.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
                {!registryItems.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={4}>
                      Nenhuma demanda registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!!backlogActivities.length && (
            <div className="card p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-2">Atividades vinculadas as sprints</h3>
              <ul className="space-y-1.5 text-sm text-gray-600 dark:text-slate-300">
                {backlogActivities.slice(0, 10).map((activity: any) => (
                  <li key={activity.id}>
                    {activity.title} {activity.is_completed ? '(concluida)' : '(em aberto)'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>

      <div className="flex justify-end">
        <button
          className="btn-secondary"
          onClick={() => archiveCompleted().catch(console.error)}
        >
          Enviar concluidas para registro
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <input
            className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            placeholder="Nova tarefa de backlog"
            value={newBacklog.title}
            onChange={(e) => setNewBacklog((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            type="date"
            className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            value={newBacklog.dueDate}
            onChange={(e) => setNewBacklog((prev) => ({ ...prev, dueDate: e.target.value }))}
          />
          <button className="btn-primary justify-center" onClick={addBacklogItem}>
            <Plus size={16} /> Adicionar
          </button>
        </div>
        <textarea
          className="input-field mt-3 h-20 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
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
            <div className="mx-3 mt-3 rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between bg-white dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-100">{column.title}</p>
              <span className="text-xs font-semibold opacity-90 text-slate-500 dark:text-slate-300">{backlogColumns[column.id].length}</span>
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

                  <div className="mt-3 flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      {item.status === 'done' && !isArchived(item) && (
                        <button
                          onClick={() => archiveBacklogItem(item).catch(console.error)}
                          className="px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                          title="Arquivar demanda"
                        >
                          Arquivar
                        </button>
                      )}
                      <button
                        onClick={() => moveBacklogCard(item.id, item.status === 'done' ? 'doing' : 'finished').catch(console.error)}
                        className={`w-7 h-7 rounded-md border inline-flex items-center justify-center transition-colors ${
                          item.status === 'done'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-500 dark:bg-emerald-900/30 dark:border-emerald-700/50'
                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400'
                        }`}
                        aria-label={item.status === 'done' ? 'Marcar como pendente' : 'Marcar como concluida'}
                        title={item.status === 'done' ? 'Desfazer conclusao' : 'Marcar como concluida'}
                      >
                        {item.status === 'done'
                          ? <CheckCircle2 size={13} />
                          : <Circle size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!backlogColumns[column.id].length && (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm dark:border-slate-700 dark:text-slate-400">
                  Arraste tarefas para esta coluna.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  );
}
