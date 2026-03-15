import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { createUser, deleteUser, getClients, getUsers, sendPasswordReset, setUserActive, updateUserProfile } from '@/lib/queries';
import { Plus, X, Loader2, CheckCircle2, AlertCircle, Pencil, KeyRound, UserX, UserCheck, Trash2 } from 'lucide-react';

interface ClientRow {
  id: number;
  company_name: string;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  avatar_url?: string | null;
  client_id?: number | null;
  is_active: boolean;
  created_at: string;
}

const emptyUserForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  avatarUrl: '',
  role: 'client' as 'admin' | 'consultant' | 'client',
  clientId: '' as string,
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-wayzen-400';

function roleBadge(role: string) {
  const map: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    consultant: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    client: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  const labels: Record<string, string> = {
    admin: 'Admin', consultant: 'Consultor', client: 'Cliente',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[role] ?? role}
    </span>
  );
}

export default function Usuarios() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [savingUser, setSavingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [runningActionId, setRunningActionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    getClients().then((data) => setClients((data || []) as ClientRow[])).catch(console.error);
    getUsers()
      .then((data) => setUsers((data || []) as UserRow[]))
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  function showMsg(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSavingUser(true);
    try {
      const created = await createUser({
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        phone: userForm.phone || undefined,
        avatarUrl: userForm.avatarUrl || undefined,
        clientId: userForm.role === 'client' && userForm.clientId ? Number(userForm.clientId) : null,
      }) as UserRow;

      setUsers((prev) => [created, ...prev]);
      setShowUserForm(false);
      setUserForm(emptyUserForm);
      showMsg('success', `Acesso criado para "${created.name}".`);
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : 'Erro ao criar acesso.');
    } finally {
      setSavingUser(false);
    }
  }

  function startEdit(userRow: UserRow) {
    setEditingUserId(userRow.id);
    setShowUserForm(true);
    setUserForm({
      name: userRow.name,
      email: userRow.email,
      password: '',
      phone: userRow.phone || '',
      avatarUrl: userRow.avatar_url || '',
      role: userRow.role as 'admin' | 'consultant' | 'client',
      clientId: userRow.client_id ? String(userRow.client_id) : '',
    });
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (editingUserId === null) {
      await handleCreateUser(e);
      return;
    }

    setSavingUser(true);
    try {
      const updated = await updateUserProfile(editingUserId, {
        name: userForm.name,
        role: userForm.role,
        phone: userForm.phone || undefined,
        avatarUrl: userForm.avatarUrl || undefined,
        clientId: userForm.role === 'client' && userForm.clientId ? Number(userForm.clientId) : null,
      }) as UserRow;

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setShowUserForm(false);
      setEditingUserId(null);
      setUserForm(emptyUserForm);
      showMsg('success', `Usuario "${updated.name}" atualizado com sucesso.`);
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : 'Erro ao atualizar usuario.');
    } finally {
      setSavingUser(false);
    }
  }

  async function handleToggleActive(target: UserRow) {
    setRunningActionId(target.id);
    try {
      const updated = await setUserActive(target.id, !target.is_active) as UserRow;
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showMsg('success', `${updated.name} agora esta ${updated.is_active ? 'ativo' : 'inativo'}.`);
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : 'Erro ao alterar status do usuario.');
    } finally {
      setRunningActionId(null);
    }
  }

  async function handleResetPassword(target: UserRow) {
    setRunningActionId(target.id);
    try {
      await sendPasswordReset(target.email);
      showMsg('success', `Link de redefinicao enviado para ${target.email}.`);
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : 'Erro ao enviar reset de senha.');
    } finally {
      setRunningActionId(null);
    }
  }

  async function handleDeleteUser(target: UserRow) {
    const ok = window.confirm(`Excluir o usuario "${target.name}"? Esta acao nao pode ser desfeita.`);
    if (!ok) return;

    setRunningActionId(target.id);
    try {
      await deleteUser(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      showMsg('success', `Usuario "${target.name}" excluido com sucesso.`);
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : 'Erro ao excluir usuario.');
    } finally {
      setRunningActionId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Visao de Usuarios</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Gestao de Usuarios</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Crie acessos de cliente, consultor e administrador.</p>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
            : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {loadingUsers ? 'Carregando...' : `${users.length} acesso(s) configurado(s)`}
        </p>
        <button onClick={() => { setEditingUserId(null); setUserForm(emptyUserForm); setShowUserForm((v) => !v); }} className="flex items-center gap-1.5 px-3 py-2 bg-wayzen-600 hover:bg-wayzen-700 text-white text-sm font-semibold rounded-lg transition-colors">
          {showUserForm ? <X size={15} /> : <Plus size={15} />}
          {showUserForm ? 'Cancelar' : 'Novo Acesso'}
        </button>
      </div>

      {showUserForm && (
        <form onSubmit={handleSaveUser} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome Completo" required>
              <input className={inputCls} value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
            </Field>
            <Field label="E-mail" required>
              <input type="email" className={`${inputCls} ${editingUserId ? 'opacity-60 cursor-not-allowed' : ''}`} value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required disabled={!!editingUserId} />
            </Field>
            {!editingUserId && (
              <Field label="Senha Temporaria" required>
                <input type="password" minLength={6} className={inputCls} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
              </Field>
            )}
            <Field label="Papel no Portal" required>
              <select className={inputCls} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'consultant' | 'client', clientId: '' })}>
                <option value="client">Cliente</option>
                <option value="consultant">Consultor</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Telefone">
              <input className={inputCls} value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </Field>
            <Field label="URL da Foto (avatar)">
              <input className={inputCls} value={userForm.avatarUrl} onChange={(e) => setUserForm({ ...userForm, avatarUrl: e.target.value })} placeholder="https://..." />
            </Field>
            {userForm.role === 'client' && (
              <Field label="Cliente vinculado" required>
                <select className={inputCls} value={userForm.clientId} onChange={(e) => setUserForm({ ...userForm, clientId: e.target.value })} required>
                  <option value="">— Selecione o cliente —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setShowUserForm(false); setEditingUserId(null); setUserForm(emptyUserForm); }} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={savingUser} className="flex items-center gap-2 px-4 py-2 bg-wayzen-600 hover:bg-wayzen-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
              {savingUser && <Loader2 size={14} className="animate-spin" />}
              {editingUserId ? 'Salvar Usuario' : 'Criar Acesso'}
            </button>
          </div>
        </form>
      )}

      {loadingUsers ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-wayzen-500" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Telefone</th>
                <th className="px-4 py-3 text-left">Papel</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Acoes</th>
                <th className="px-4 py-3 text-left">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
              {users.map((u) => {
                const linkedClient = clients.find((c) => c.id === u.client_id);
                return (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{u.phone || '—'}</td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{linkedClient ? linkedClient.company_name : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          disabled={runningActionId === u.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50"
                        >
                          <Pencil size={12} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u)}
                          disabled={runningActionId === u.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 disabled:opacity-50"
                        >
                          {runningActionId === u.id ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          disabled={runningActionId === u.id}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg disabled:opacity-50 ${
                            u.is_active
                              ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {u.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                          {u.is_active ? 'Inativar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          disabled={runningActionId === u.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 disabled:opacity-50"
                        >
                          {runningActionId === u.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Excluir
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
