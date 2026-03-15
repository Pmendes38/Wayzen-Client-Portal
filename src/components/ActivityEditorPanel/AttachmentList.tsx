import { Link2, Plus, Trash2 } from 'lucide-react';
import { SprintAttachment } from '@/types/domain';

interface AttachmentListProps {
  attachments: SprintAttachment[];
  disabled?: boolean;
  onChange: (attachments: SprintAttachment[]) => void;
}

function createAttachment(): SprintAttachment {
  return {
    id: globalThis.crypto?.randomUUID?.() || `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    url: '',
    type: '',
    uploaded_at: new Date().toISOString(),
  };
}

export default function AttachmentList({ attachments, disabled, onChange }: AttachmentListProps) {
  const updateAttachment = (attachmentId: string, updates: Partial<SprintAttachment>) => {
    onChange(attachments.map((attachment) => (
      attachment.id === attachmentId ? { ...attachment, ...updates } : attachment
    )));
  };

  const removeAttachment = (attachmentId: string) => {
    onChange(attachments.filter((attachment) => attachment.id !== attachmentId));
  };

  const addAttachment = () => {
    onChange([...attachments, createAttachment()]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Anexos</label>
        <button
          type="button"
          onClick={addAttachment}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Plus size={12} /> Adicionar
        </button>
      </div>

      {!attachments.length && (
        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nenhum anexo informado.
        </div>
      )}

      {attachments.map((attachment) => (
        <div key={attachment.id} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              value={attachment.name}
              disabled={disabled}
              onChange={(event) => updateAttachment(attachment.id, { name: event.target.value })}
              className="input-field text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              placeholder="Nome do anexo"
            />
            <input
              value={attachment.type || ''}
              disabled={disabled}
              onChange={(event) => updateAttachment(attachment.id, { type: event.target.value })}
              className="input-field text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              placeholder="Tipo / MIME"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                disabled={disabled}
                className="rounded-md p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-900/20"
                aria-label="Remover anexo"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700">
            <Link2 size={14} className="text-slate-400" />
            <input
              value={attachment.url}
              disabled={disabled}
              onChange={(event) => updateAttachment(attachment.id, { url: event.target.value })}
              className="input-field flex-1 border-0 px-0 py-0 text-sm focus:ring-0 dark:bg-transparent dark:text-slate-100"
              placeholder="URL do anexo"
            />
          </div>
        </div>
      ))}
    </div>
  );
}