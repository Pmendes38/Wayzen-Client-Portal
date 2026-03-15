import { Plus, Trash2 } from 'lucide-react';
import { SprintSubtask } from '@/types/domain';

interface SubtaskListProps {
  subtasks: SprintSubtask[];
  disabled?: boolean;
  onChange: (subtasks: SprintSubtask[]) => void;
}

function createSubtask(): SprintSubtask {
  return {
    id: globalThis.crypto?.randomUUID?.() || `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    done: false,
    created_at: new Date().toISOString(),
  };
}

export default function SubtaskList({ subtasks, disabled, onChange }: SubtaskListProps) {
  const updateSubtask = (subtaskId: string, updates: Partial<SprintSubtask>) => {
    onChange(subtasks.map((subtask) => (
      subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
    )));
  };

  const removeSubtask = (subtaskId: string) => {
    onChange(subtasks.filter((subtask) => subtask.id !== subtaskId));
  };

  const addSubtask = () => {
    onChange([...subtasks, createSubtask()]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Subtarefas</label>
        <button
          type="button"
          onClick={addSubtask}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Plus size={12} /> Adicionar
        </button>
      </div>

      {!subtasks.length && (
        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nenhuma subtarefa adicionada.
        </div>
      )}

      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
          <input
            type="checkbox"
            checked={subtask.done}
            disabled={disabled}
            onChange={(event) => updateSubtask(subtask.id, { done: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-wayzen-600"
          />
          <input
            value={subtask.title}
            disabled={disabled}
            onChange={(event) => updateSubtask(subtask.id, { title: event.target.value })}
            className="input-field flex-1 border-0 px-0 py-0 text-sm focus:ring-0 dark:bg-transparent dark:text-slate-100"
            placeholder="Titulo da subtarefa"
          />
          <button
            type="button"
            onClick={() => removeSubtask(subtask.id)}
            disabled={disabled}
            className="rounded-md p-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-900/20"
            aria-label="Remover subtarefa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}