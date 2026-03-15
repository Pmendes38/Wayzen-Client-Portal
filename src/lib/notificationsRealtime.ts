import { NotificationItem } from '@/types/domain';

const NOTIFICATIONS_UNREAD_EVENT = 'wayzen:notifications-unread-count';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function countUnreadByReadAt(notifications: NotificationItem[]): number {
  return notifications.filter((notification) => !notification.read_at).length;
}

export function emitNotificationsUnreadCount(count: number) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent<number>(NOTIFICATIONS_UNREAD_EVENT, { detail: count }));
}

export function subscribeNotificationsUnreadCount(handler: (count: number) => void) {
  if (!isBrowser()) return () => {};

  const listener = (event: Event) => {
    const custom = event as CustomEvent<number>;
    handler(Number(custom.detail || 0));
  };

  window.addEventListener(NOTIFICATIONS_UNREAD_EVENT, listener);
  return () => window.removeEventListener(NOTIFICATIONS_UNREAD_EVENT, listener);
}
