import { useEffect, useMemo, useState } from 'react';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import { NotificationItem } from '@/types/domain';
import { Bell, CheckCheck, Ticket, BarChart3, FileText, FolderOpen, Info } from 'lucide-react';
import { countUnreadByReadAt, emitNotificationsUnreadCount } from '@/lib/notificationsRealtime';

type NotificationFilter = 'all' | NotificationItem['category'];

const CATEGORY_META: Record<NotificationFilter, { label: string; chipClass: string }> = {
  all: {
    label: 'Todas',
    chipClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
  activities: {
    label: 'Atividades',
    chipClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
  },
  chat: {
    label: 'Chat',
    chipClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200',
  },
  reports: {
    label: 'Relatórios',
    chipClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200',
  },
  documents: {
    label: 'Documentos',
    chipClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
  },
  system: {
    label: 'Sistema',
    chipClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
  },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  useEffect(() => {
    portalService.getNotifications()
      .then((data) => {
        setNotifications(data);
        emitNotificationsUnreadCount(countUnreadByReadAt(data));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await portalService.markAllNotificationsRead();
    const readAt = new Date().toISOString();
    setNotifications((prev) => {
      const next = prev.map((notification) => ({
        ...notification,
        is_read: 1 as const,
        read_at: notification.read_at || readAt,
      }));
      emitNotificationsUnreadCount(countUnreadByReadAt(next));
      return next;
    });
  };

  const markRead = async (id: number) => {
    await portalService.markNotificationRead(id);
    const readAt = new Date().toISOString();
    setNotifications((prev) => {
      const next = prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              is_read: 1 as const,
              read_at: notification.read_at || readAt,
            }
          : notification
      );
      emitNotificationsUnreadCount(countUnreadByReadAt(next));
      return next;
    });
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

  const unreadCount = useMemo(() => countUnreadByReadAt(notifications), [notifications]);
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((notification) => notification.category === activeFilter);
  }, [notifications, activeFilter]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Notificações</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck size={16} /> Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_META) as NotificationFilter[]).map((filter) => {
          const selected = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selected
                  ? 'bg-wayzen-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {CATEGORY_META[filter].label}
            </button>
          );
        })}
      </div>

      <div className="card divide-y divide-gray-100">
        {filteredNotifications.map((notif) => {
          const unread = !notif.read_at;
          return (
          <div key={notif.id} onClick={() => unread && markRead(notif.id)} className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors ${unread ? 'bg-wayzen-50/50 dark:bg-wayzen-900/10' : ''}`}>
            <div className="mt-0.5">{typeIcon(notif.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-sm ${unread ? 'font-semibold text-gray-900 dark:text-slate-100' : 'font-medium text-gray-600 dark:text-slate-300'}`}>{notif.title}</h3>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${CATEGORY_META[notif.category].chipClass}`}>
                  {CATEGORY_META[notif.category].label}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${unread ? 'bg-wayzen-100 text-wayzen-700 dark:bg-wayzen-900/30 dark:text-wayzen-200' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {unread ? 'Não lida' : 'Lida'}
                </span>
                {unread && <span className="w-2 h-2 bg-wayzen-500 rounded-full flex-shrink-0" />}
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{notif.message || 'Sem descrição adicional.'}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Evento: {notif.event_type}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {new Date(notif.occurred_at || notif.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {unread && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  markRead(notif.id);
                }}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:border-wayzen-300 hover:text-wayzen-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-wayzen-500 dark:hover:text-wayzen-300"
              >
                Marcar como lida
              </button>
            )}
            </div>
          );
        })}
        {!filteredNotifications.length && (
          <div className="p-12 text-center">
            <Bell size={48} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-slate-500">Nenhuma notificação para este filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}
