import { useEffect, useMemo, useState } from 'react';
import { Loader2, Users, X } from 'lucide-react';
import { portalService } from '@/lib/services/portal';
import { ChatRoom, ContactUser } from '@/types/domain';
import ContactMultiSelect from './ContactMultiSelect';

type GroupRoomModalProps = {
  isOpen: boolean;
  clientId?: number | null;
  contacts: ContactUser[];
  onClose: () => void;
  onCreated?: (room: ChatRoom) => void;
};

function toParticipantId(contact: ContactUser): number | null {
  if (typeof contact.user_id === 'number') return contact.user_id;
  if (contact.source !== 'project_contact') return contact.id;
  return null;
}

export default function GroupRoomModal({ isOpen, clientId, contacts, onClose, onCreated }: GroupRoomModalProps) {
  const [name, setName] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectableContacts = useMemo(
    () => contacts.filter((contact) => toParticipantId(contact) !== null),
    [contacts]
  );

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setSelectedContactIds([]);
      setSaving(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (saving) return;
    if (!clientId) {
      setErrorMessage('Cliente ativo nao encontrado para criar o grupo.');
      return;
    }

    const groupName = name.trim();
    if (!groupName) {
      setErrorMessage('Informe um nome para o grupo.');
      return;
    }

    const participantIds = selectedContactIds
      .map((contactId) => selectableContacts.find((contact) => contact.id === contactId))
      .map((contact) => (contact ? toParticipantId(contact) : null))
      .filter((id): id is number => typeof id === 'number');

    if (!participantIds.length) {
      setErrorMessage('Selecione ao menos um participante.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const room = await portalService.createChatGroupRoom(clientId, {
        name: groupName,
        participantIds,
      });
      onCreated?.(room as ChatRoom);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar grupo.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Novo grupo privado</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Escolha um nome e selecione os participantes.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
            aria-label="Fechar modal"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-slate-400">
              Nome do grupo
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Grupo Pedagogico"
              className="input-field"
              disabled={saving}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-slate-400">
              Participantes
            </label>
            <ContactMultiSelect
              contacts={selectableContacts}
              selectedIds={selectedContactIds}
              onChange={setSelectedContactIds}
              disabled={saving}
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-secondary disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-70"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
            {saving ? 'Criando grupo...' : 'Criar grupo'}
          </button>
        </div>
      </div>
    </div>
  );
}
