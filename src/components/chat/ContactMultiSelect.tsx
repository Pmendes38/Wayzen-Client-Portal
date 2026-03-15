import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { ContactUser } from '@/types/domain';

type ContactMultiSelectProps = {
  contacts: ContactUser[];
  selectedIds: number[];
  onChange: (nextIds: number[]) => void;
  disabled?: boolean;
};

function roleLabel(role: ContactUser['role']) {
  if (role === 'admin') return 'Admin';
  if (role === 'consultant') return 'Consultor';
  return 'Cliente';
}

export default function ContactMultiSelect({ contacts, selectedIds, onChange, disabled = false }: ContactMultiSelectProps) {
  const [search, setSearch] = useState('');

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;

    return contacts.filter((contact) => {
      const haystack = `${contact.name} ${contact.email || ''} ${roleLabel(contact.role)}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [contacts, search]);

  const selectedMap = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleContact = (contactId: number) => {
    if (disabled) return;

    if (selectedMap.has(contactId)) {
      onChange(selectedIds.filter((id) => id !== contactId));
      return;
    }

    onChange([...selectedIds, contactId]);
  };

  const clearSelection = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar participantes..."
          className="input-field pl-8"
          disabled={disabled}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          {selectedIds.length} selecionado(s)
        </p>
        <button
          type="button"
          onClick={clearSelection}
          disabled={disabled || !selectedIds.length}
          className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Limpar
        </button>
      </div>

      <div className="max-h-64 overflow-auto rounded-xl border border-gray-200 dark:border-slate-700">
        {filteredContacts.map((contact) => {
          const isSelected = selectedMap.has(contact.id);
          return (
            <button
              key={contact.id}
              type="button"
              onClick={() => toggleContact(contact.id)}
              disabled={disabled}
              className={`w-full border-b border-gray-100 p-3 text-left transition-colors last:border-b-0 dark:border-slate-800 ${
                isSelected
                  ? 'bg-wayzen-50/70 dark:bg-wayzen-900/20'
                  : 'bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{contact.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {roleLabel(contact.role)}
                    {contact.source === 'project_contact' ? ' • Contato do projeto' : ''}
                  </p>
                  {contact.email && (
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">{contact.email}</p>
                  )}
                </div>

                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? 'border-wayzen-500 bg-wayzen-500 text-white'
                      : 'border-gray-300 text-transparent dark:border-slate-600'
                  }`}
                >
                  <Check size={12} />
                </span>
              </div>
            </button>
          );
        })}

        {!filteredContacts.length && (
          <div className="p-4 text-center text-sm text-gray-400 dark:text-slate-500">
            Nenhum contato encontrado.
          </div>
        )}
      </div>

      {!!selectedIds.length && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const contact = contacts.find((item) => item.id === id);
            if (!contact) return null;

            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {contact.name}
                <button
                  type="button"
                  onClick={() => toggleContact(id)}
                  disabled={disabled}
                  className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label={`Remover ${contact.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
