import { useEffect, useState } from 'react';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import { NotificationItem } from '@/types/domain';
import { Bell, CheckCheck, Ticket, BarChart3, FileText, FolderOpen, Info } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalService.getNotifications()
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await portalService.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const markRead = async (id: number) => {
    await portalService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  const typeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ticket_update': return <Ticket size={18} className="text-orange-500" />;
      case 'sprint_update': return <BarChart3 size={18} className="text-blue-500" />;
      case 'document': return <FolderOpen size={18} className="text-green-500" />;
      case 'report': return <FileText size={18} className="text-wayzen-500" />;
      default: return <Info size={18} className="text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-500 mt-1">{unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck size={16} /> Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="card divide-y divide-gray-100">
        {notifications.map(notif => (
          <div key={notif.id} onClick={() => !notif.is_read && markRead(notif.id)} className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-wayzen-50/50' : ''}`}>
            <div className="mt-0.5">{typeIcon(notif.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>{notif.title}</h3>
                {!notif.is_read && <span className="w-2 h-2 bg-wayzen-500 rounded-full flex-shrink-0" />}
              </div>
              {notif.message && <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>}
              <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        {!notifications.length && (
          <div className="p-12 text-center">
            <Bell size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma notificação</p>
          </div>
        )}
      </div>
    </div>
  );
}
