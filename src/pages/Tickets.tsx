import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePortalScope } from '@/hooks/usePortalScope';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import { ChatMessage, ChatRoom, ContactUser } from '@/types/domain';
import { Lock, MessageSquare, Plus, Send, Users } from 'lucide-react';
import GroupRoomModal from '@/components/chat/GroupRoomModal';

export default function Tickets() {
  const { user } = useAuth();
  const { activeClientId } = usePortalScope();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [contacts, setContacts] = useState<ContactUser[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const roomPrivacyMeta = (roomType: ChatRoom['room_type']) => {
    if (roomType === 'direct') {
      return {
        label: 'Privado',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        icon: <Lock size={12} />,
      };
    }

    if (roomType === 'internal') {
      return {
        label: 'Interno Wayzen',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
        icon: null,
      };
    }

    if (roomType === 'group') {
      return {
        label: 'Grupo Privado',
        className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200',
        icon: null,
      };
    }

    return {
      label: 'Canal Geral',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
      icon: null,
    };
  };

  const roomLabel = (room: ChatRoom) => {
    if (room.room_type === 'general') return 'Grupo Geral';
    if (room.room_type === 'internal') return 'Grupo Interno';
    return room.contact_name ? `Direto: ${room.contact_name}` : room.name;
  };

  const groupedRooms = useMemo(
    () => ({
      groups: rooms.filter((room) => room.room_type !== 'direct'),
      directs: rooms.filter((room) => room.room_type === 'direct'),
    }),
    [rooms]
  );

  const loadRoomsAndContacts = async (preferredRoomId?: number) => {
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [roomData, contactData] = await Promise.all([
        portalService.getChatRooms(activeClientId),
        portalService.getChatContacts(activeClientId),
      ]);
      setRooms(roomData);
      setContacts(contactData);

      const nextRoom = preferredRoomId
        ? roomData.find((room) => room.id === preferredRoomId)
        : null;

      if (nextRoom) {
        setSelectedRoom(nextRoom);
      } else if (selectedRoom) {
        const persisted = roomData.find((room) => room.id === selectedRoom.id);
        if (persisted) {
          setSelectedRoom(persisted);
        } else if (roomData.length) {
          setSelectedRoom(roomData[0]);
        } else {
          setSelectedRoom(null);
        }
      } else if (roomData.length) {
        setSelectedRoom(roomData[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoomsAndContacts();
  }, [activeClientId]);

  const loadMessages = async (room: ChatRoom) => {
    setSelectedRoom(room);
    const data = await portalService.getChatMessages(room.id);
    setMessages(data);
  };

  useEffect(() => {
    if (!selectedRoom) {
      setMessages([]);
      return;
    }
    loadMessages(selectedRoom).catch(console.error);
  }, [selectedRoom?.id]);

  const openDirectChat = async (contact: ContactUser) => {
    if (!activeClientId) return;

    const linkedUserId = contact.user_id ?? (contact.source !== 'project_contact' ? contact.id : null);
    const room = linkedUserId
      ? await portalService.getOrCreateDirectChatRoom(activeClientId, linkedUserId)
      : await portalService.getOrCreateProjectContactRoom(
          activeClientId,
          contact.name,
          contact.project_contact_id || Math.abs(contact.id)
        );

    const refreshedRooms = await portalService.getChatRooms(activeClientId);
    setRooms(refreshedRooms);
    const selected = refreshedRooms.find((item) => item.id === room.id) || room;
    setSelectedRoom(selected as ChatRoom);
    const msgs = await portalService.getChatMessages(room.id);
    setMessages(msgs);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;
    await portalService.createChatMessage(selectedRoom.id, newMessage.trim());
    setNewMessage('');
    const data = await portalService.getChatMessages(selectedRoom.id);
    setMessages(data);
  };

  const handleGroupRoomCreated = async (room: ChatRoom) => {
    setIsGroupModalOpen(false);
    await loadRoomsAndContacts(room.id);
  };

  if (loading) return <PageLoader />;

  if (!activeClientId) {
    return <div className="card p-8 text-center text-gray-500 dark:text-slate-400">Selecione um portal para usar o chat.</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Chat do Projeto</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          Conversa em grupo geral, grupo interno e chat direto por contato.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-slate-400">Grupos</p>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-wayzen-300 hover:text-wayzen-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-wayzen-500 dark:hover:text-wayzen-300"
              >
                <Plus size={12} /> Novo grupo
              </button>
            </div>
            <div className="space-y-2">
              {groupedRooms.groups.map((room) => (
                <button
                  key={room.id}
                  onClick={() => loadMessages(room)}
                  className={`w-full p-3 rounded-xl text-left border transition-colors ${selectedRoom?.id === room.id ? 'border-wayzen-500 bg-wayzen-50/60 dark:bg-wayzen-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-wayzen-300'}`}
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{roomLabel(room)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${roomPrivacyMeta(room.room_type).className}`}>
                      {roomPrivacyMeta(room.room_type).icon}
                      {roomPrivacyMeta(room.room_type).label}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {room.room_type === 'internal' ? 'Apenas equipe interna' : 'Time Wayzen e cliente'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-slate-400 mb-2">Contatos</p>
            <div className="space-y-2 max-h-64 overflow-auto">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => openDirectChat(contact)}
                  className="w-full p-3 rounded-xl text-left border border-gray-200 dark:border-slate-700 hover:border-wayzen-300 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{contact.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {contact.role === 'client' ? 'Cliente' : contact.role === 'admin' ? 'Admin' : 'Consultor'}
                    {contact.source === 'project_contact' ? ' • Contato do projeto' : ''}
                  </p>
                  {contact.email && (
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">{contact.email}</p>
                  )}
                </button>
              ))}
              {!contacts.length && <p className="text-sm text-gray-400 dark:text-slate-500">Nenhum contato disponível.</p>}
            </div>
          </div>

          {groupedRooms.directs.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-slate-400 mb-2">Conversas Diretas</p>
              <div className="space-y-2">
                {groupedRooms.directs.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => loadMessages(room)}
                    className={`w-full p-3 rounded-xl text-left border transition-colors ${selectedRoom?.id === room.id ? 'border-wayzen-500 bg-wayzen-50/60 dark:bg-wayzen-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-wayzen-300'}`}
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{roomLabel(room)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${roomPrivacyMeta(room.room_type).className}`}>
                        {roomPrivacyMeta(room.room_type).icon}
                        {roomPrivacyMeta(room.room_type).label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedRoom ? (
            <div className="card flex flex-col h-[640px]">
              <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{roomLabel(selectedRoom)}</h2>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${roomPrivacyMeta(selectedRoom.room_type).className}`}>
                      {roomPrivacyMeta(selectedRoom.room_type).icon}
                      {roomPrivacyMeta(selectedRoom.room_type).label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {selectedRoom.room_type === 'internal'
                      ? 'Canal interno invisivel para o cliente.'
                      : selectedRoom.room_type === 'general'
                        ? 'Canal geral do cliente.'
                        : 'Conversa direta com contato selecionado.'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-wayzen-100 text-wayzen-700 flex items-center justify-center">
                  {selectedRoom.room_type === 'general' ? <Users size={18} /> : <MessageSquare size={18} />}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-5 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.user_id === user?.id ? 'bg-wayzen-500 text-white' : 'bg-gray-100 dark:bg-slate-800 dark:text-slate-100'}`}>
                      <p className={`text-xs font-medium mb-1 ${msg.user_id === user?.id ? 'text-wayzen-100' : 'text-gray-500 dark:text-slate-400'}`}>
                        {msg.author_name} • {msg.author_role === 'client' ? 'Cliente' : msg.author_role === 'admin' ? 'Admin' : 'Consultor'}
                      </p>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
                {!messages.length && (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400 dark:text-slate-500">
                    Nenhuma mensagem ainda neste canal.
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="input-field"
                    placeholder="Digite sua mensagem..."
                  />
                  <button onClick={sendMessage} className="btn-primary flex items-center gap-1">
                    <Send size={16} /> Enviar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center text-gray-400 dark:text-slate-500 h-[640px] flex items-center justify-center">
              Selecione um grupo, contato ou conversa direta.
            </div>
          )}
        </div>
      </div>

      <GroupRoomModal
        isOpen={isGroupModalOpen}
        clientId={activeClientId}
        contacts={contacts}
        onClose={() => setIsGroupModalOpen(false)}
        onCreated={handleGroupRoomCreated}
      />
    </div>
  );
}
