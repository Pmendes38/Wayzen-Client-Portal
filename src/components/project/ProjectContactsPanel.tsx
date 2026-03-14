import { useState } from 'react';
import { Mail, MessageCircle, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { ProjectContact } from '@/types/domain';

type ProjectContactInput = Omit<ProjectContact, 'id' | 'client_id' | 'created_at'>;

type ProjectContactsPanelProps = {
  contacts: ProjectContact[];
  onCreate: (payload: ProjectContactInput) => Promise<void>;
  onUpdate: (contactId: number, payload: ProjectContactInput) => Promise<void>;
  onDelete: (contactId: number) => Promise<void>;
};

const emptyForm: ProjectContactInput = {
  name: '',
  role: '',
  email: '',
  phone: '',
  notes: '',
};

export default function ProjectContactsPanel({ contacts, onCreate, onUpdate, onDelete }: ProjectContactsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProjectContactInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (contact: ProjectContact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
    });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const sanitizePhone = (phone: string) => phone.replace(/\D/g, '');

  const openWhatsapp = (phone: string, name: string) => {
    const normalized = sanitizePhone(phone);
    if (!normalized) {
      setFeedback('Numero de telefone invalido para WhatsApp.');
      return;
    }
    const message = encodeURIComponent(`Oi ${name}, tudo bem? Mensagem enviada pelo portal Wayzen.`);
    window.open(`https://wa.me/${normalized}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (contactId: number) => {
    try {
      await onDelete(contactId);
      setFeedback('Contato removido com sucesso.');
    } catch (err: any) {
      console.error(err);
      setFeedback(err?.message || 'Nao foi possivel excluir o contato.');
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.role.trim() || !form.email.trim() || !form.phone.trim() || !form.notes.trim()) {
      setFeedback('Preencha todos os campos para salvar o contato.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
    };

    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingId) {
        await onUpdate(editingId, payload);
        setFeedback('Contato atualizado com sucesso.');
      } else {
        await onCreate(payload);
        setFeedback('Contato criado com sucesso.');
      }
      close();
    } catch (err: any) {
      console.error(err);
      setFeedback(err?.message || 'Nao foi possivel salvar o contato.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Contatos do Projeto</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Stakeholders vinculados ao projeto ativo.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={14} /> Novo contato
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Cargo</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Telefone</th>
              <th className="px-4 py-3 text-left">Observacoes</th>
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id} className="border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <td className="px-4 py-3 font-semibold">{contact.name}</td>
                <td className="px-4 py-3">{contact.role}</td>
                <td className="px-4 py-3">{contact.email}</td>
                <td className="px-4 py-3">{contact.phone}</td>
                <td className="px-4 py-3 max-w-60 truncate" title={contact.notes}>{contact.notes}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => openEdit(contact)} aria-label={`Editar ${contact.name}`}>
                      <Pencil size={14} />
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      onClick={() => window.open(`mailto:${contact.email}`, '_blank', 'noopener,noreferrer')}
                      aria-label={`Enviar email para ${contact.name}`}
                    >
                      <Mail size={14} />
                    </button>
                    <button
                      className="rounded-lg border border-emerald-200 p-2 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-950/30"
                      onClick={() => openWhatsapp(contact.phone, contact.name)}
                      aria-label={`Enviar WhatsApp para ${contact.name}`}
                    >
                      <MessageCircle size={14} />
                    </button>
                    <button className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30" onClick={() => handleDelete(contact.id)} aria-label={`Excluir ${contact.name}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!contacts.length && (
        <div className="p-10 text-center text-slate-400 dark:text-slate-500">
          <Users size={36} className="mx-auto mb-2" />
          Nenhum contato cadastrado para este projeto.
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {editingId ? 'Editar contato' : 'Novo contato'}
              </h4>
              <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={close} aria-label="Fechar formulario de contato">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input-field" placeholder="Nome" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              <input className="input-field" placeholder="Cargo" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} />
              <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              <input className="input-field" placeholder="Telefone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <textarea className="input-field md:col-span-2 h-24" placeholder="Observacoes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-secondary" onClick={close}>Cancelar</button>
              <button className="btn-primary" onClick={submit} disabled={submitting}>{submitting ? 'Salvando...' : editingId ? 'Salvar' : 'Criar contato'}</button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300">
          {feedback}
        </div>
      )}
    </section>
  );
}
