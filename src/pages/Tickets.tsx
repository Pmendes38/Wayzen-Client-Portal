import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import { TicketItem, TicketMessage, TicketPriority, TicketStatus } from '@/types/domain';
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as TicketPriority, category: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await portalService.getTickets();
      setTickets(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openTicket = async (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    const msgs = await portalService.getTicketMessages(ticket.id);
    setMessages(msgs);
  };

  const createTicket = async () => {
    if (!form.title) return;
    await portalService.createTicket({ ...form, clientId: user?.clientId || 1 });
    setShowNewTicket(false);
    setForm({ title: '', description: '', priority: 'medium', category: '' });
    loadTickets();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    await portalService.addTicketMessage(selectedTicket.id, newMessage);
    setNewMessage('');
    const msgs = await portalService.getTicketMessages(selectedTicket.id);
    setMessages(msgs);
  };

  const updateTicketStatus = async (id: number, status: TicketStatus) => {
    await portalService.updateTicketStatus(id, status);
    loadTickets();
    if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status });
  };

  const priorityBadge = (p: TicketPriority) => {
    switch (p) { case 'urgent': return 'badge-red'; case 'high': return 'badge-yellow'; case 'low': return 'badge-gray'; default: return 'badge-blue'; }
  };
  const statusIcon = (s: TicketStatus) => {
    switch (s) { case 'resolved': case 'closed': return <CheckCircle2 size={16} className="text-green-500" />; case 'in_progress': return <Clock size={16} className="text-blue-500" />; default: return <AlertCircle size={16} className="text-orange-500" />; }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
          <p className="text-gray-500 mt-1">Abra e acompanhe tickets de suporte</p>
        </div>
        <button onClick={() => setShowNewTicket(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-3">
          {tickets.map(ticket => (
            <button key={ticket.id} onClick={() => openTicket(ticket)} className={`card p-4 w-full text-left hover:border-wayzen-300 transition-colors ${selectedTicket?.id === ticket.id ? 'border-wayzen-500 ring-1 ring-wayzen-500' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{ticket.title}</h3>
                {statusIcon(ticket.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${priorityBadge(ticket.priority)}`}>{ticket.priority === 'urgent' ? 'Urgente' : ticket.priority === 'high' ? 'Alta' : ticket.priority === 'low' ? 'Baixa' : 'Média'}</span>
                <span className="text-xs text-gray-400">{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </button>
          ))}
          {!tickets.length && <div className="card p-8 text-center text-gray-400">Nenhum ticket</div>}
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="card flex flex-col h-[600px]">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedTicket.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedTicket.description}</p>
                  </div>
                  {user?.role !== 'client' && (
                    <select value={selectedTicket.status} onChange={e => updateTicketStatus(selectedTicket.id, e.target.value as any)} className="input-field w-auto text-sm">
                      <option value="open">Aberto</option>
                      <option value="in_progress">Em Progresso</option>
                      <option value="resolved">Resolvido</option>
                      <option value="closed">Fechado</option>
                    </select>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto p-5 space-y-4">
                {messages.filter((m: TicketMessage) => user?.role !== 'client' || !m.is_internal).map(msg => (
                  <div key={msg.id} className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.user_id === user?.id ? 'bg-wayzen-500 text-white' : msg.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-100'}`}>
                      <p className={`text-xs font-medium mb-1 ${msg.user_id === user?.id ? 'text-wayzen-200' : 'text-gray-500'}`}>
                        {msg.author_name} {msg.is_internal ? '(interno)' : ''} • {msg.author_role === 'client' ? 'Cliente' : 'Wayzen'}
                      </p>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="input-field" placeholder="Digite sua mensagem..." />
                  <button onClick={sendMessage} className="btn-primary flex items-center gap-1">
                    <MessageSquare size={16} /> Enviar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center text-gray-400 h-[600px] flex items-center justify-center">
              Selecione um ticket para ver os detalhes
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Novo Ticket</h2>
              <button onClick={() => setShowNewTicket(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Descreva o problema brevemente" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field h-24 resize-none" placeholder="Detalhes do problema..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as TicketPriority })} className="input-field">
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field" placeholder="Ex: CRM, Site..." />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowNewTicket(false)} className="btn-secondary">Cancelar</button>
                <button onClick={createTicket} className="btn-primary">Criar Ticket</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
