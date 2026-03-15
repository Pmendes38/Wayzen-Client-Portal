import { useState } from 'react';
import { CalendarDays, Link2, Loader2, Save, X } from 'lucide-react';
import { Sprint, SprintAttachment, SprintSubtask } from '@/types/domain';
import SubtaskList from './SubtaskList';
import AttachmentList from './AttachmentList';

export type ActivityEditorKind = 'task' | 'backlog';
export type ActivityEditorSyncState = 'idle' | 'saving' | 'syncing';

export interface ActivityEditorValue {
  title: string;
  description: string;
  contextNotes: string;
  sprintId: string;
  occurredOn: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  subtasks: SprintSubtask[];
  attachments: SprintAttachment[];
}

interface ActivityEditorPanelProps {
  isOpen: boolean;
  kind: ActivityEditorKind;
  title: string;
  initialValue: ActivityEditorValue;
  sprints: Sprint[];
  saving?: boolean;
  syncState?: ActivityEditorSyncState;
  onClose: () => void;
  onSave: (value: ActivityEditorValue) => Promise<void> | void;
}

export default function ActivityEditorPanel({
  isOpen,
  kind,
  title,
  initialValue,
  sprints,
  saving = false,
  syncState = 'idle',
  onClose,
  onSave,
}: ActivityEditorPanelProps) {
  const [draft, setDraft] = useState<ActivityEditorValue>(initialValue);

  if (!isOpen) return null;

  const disabled = saving || syncState !== 'idle';
  const saveLabel = syncState === 'syncing' ? 'Sincronizando...' : saving ? 'Salvando...' : 'Salvar atividade';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {kind === 'task' ? 'Edicao da atividade da sprint' : 'Edicao da atividade do kanban'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
            aria-label="Fechar editor"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="flex-1 overflow-y-auto px-5 py-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSave(draft);
          }}
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Titulo</label>
              <input
                value={draft.title}
                disabled={disabled}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                placeholder="Titulo da atividade"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {kind === 'task' ? 'Descricao' : 'Descricao / detalhes'}
              </label>
              <textarea
                value={draft.description}
                disabled={disabled}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                className="input-field h-24 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                placeholder="Detalhes da atividade"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Contexto</label>
              <textarea
                value={draft.contextNotes}
                disabled={disabled}
                onChange={(event) => setDraft((prev) => ({ ...prev, contextNotes: event.target.value }))}
                className="input-field h-24 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                placeholder="Observacoes, contexto de negocio ou alinhamentos"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Sprint vinculada</label>
                <select
                  value={draft.sprintId}
                  disabled={disabled || kind === 'task'}
                  onChange={(event) => setDraft((prev) => ({ ...prev, sprintId: event.target.value }))}
                  className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">Sem sprint</option>
                  {sprints.map((sprint) => (
                    <option key={sprint.id} value={String(sprint.id)}>
                      {sprint.name}
                    </option>
                  ))}
                </select>
              </div>

              {kind === 'backlog' ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Data de entrada</label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <CalendarDays size={16} className="text-slate-400" />
                    <input
                      type="date"
                      value={draft.occurredOn}
                      disabled={disabled}
                      onChange={(event) => setDraft((prev) => ({ ...prev, occurredOn: event.target.value }))}
                      className="input-field flex-1 border-0 px-0 py-0 focus:ring-0 dark:bg-transparent dark:text-slate-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Data de inicio</label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <CalendarDays size={16} className="text-slate-400" />
                    <input
                      type="date"
                      value={draft.startDate}
                      disabled={disabled}
                      onChange={(event) => setDraft((prev) => ({ ...prev, startDate: event.target.value }))}
                      className="input-field flex-1 border-0 px-0 py-0 focus:ring-0 dark:bg-transparent dark:text-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {kind === 'task' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Data final</label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <CalendarDays size={16} className="text-slate-400" />
                    <input
                      type="date"
                      value={draft.endDate}
                      disabled={disabled}
                      onChange={(event) => setDraft((prev) => ({ ...prev, endDate: event.target.value }))}
                      className="input-field flex-1 border-0 px-0 py-0 focus:ring-0 dark:bg-transparent dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Prazo previsto</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <CalendarDays size={16} className="text-slate-400" />
                  <input
                    type="date"
                    value={draft.dueDate}
                    disabled={disabled}
                    onChange={(event) => setDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
                    className="input-field flex-1 border-0 px-0 py-0 focus:ring-0 dark:bg-transparent dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <SubtaskList
              subtasks={draft.subtasks}
              disabled={disabled}
              onChange={(subtasks) => setDraft((prev) => ({ ...prev, subtasks }))}
            />

            <AttachmentList
              attachments={draft.attachments}
              disabled={disabled}
              onChange={(attachments) => setDraft((prev) => ({ ...prev, attachments }))}
            />

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Link2 size={14} />
                {draft.sprintId ? 'Atividade preparada para manter sincronizacao entre Sprint e Kanban.' : 'Sem sprint vinculada no momento.'}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={disabled}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={disabled || !draft.title.trim()}
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {(saving || syncState === 'syncing') ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}