import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Ticket, FileText, FolderOpen,
  BarChart3, Bell, LogOut, ChevronLeft, ChevronRight, CalendarDays, KanbanSquare, ShieldCheck, Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { portalService } from '@/lib/services/portal';
import { countUnreadByReadAt, subscribeNotificationsUnreadCount } from '@/lib/notificationsRealtime';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isInternal = user?.role === 'admin' || user?.role === 'consultant';

  useEffect(() => {
    let mounted = true;

    portalService
      .getNotifications()
      .then((data) => {
        if (!mounted) return;
        setUnreadNotificationsCount(countUnreadByReadAt(data));
      })
      .catch(console.error);

    const unsubscribe = subscribeNotificationsUnreadCount((count) => {
      if (!mounted) return;
      setUnreadNotificationsCount(count);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const navItems = isInternal
    ? [
        { to: user?.role === 'admin' ? '/adm' : '/consultor', icon: LayoutDashboard, label: user?.role === 'admin' ? 'Portal Wayzen (ADM)' : 'Portal Consultor' },
        { to: '/kanban', icon: KanbanSquare, label: 'Kanban' },
        { to: '/sprints', icon: BarChart3, label: 'Sprints' },
        { to: '/meetings', icon: CalendarDays, label: 'Agenda e Chamadas' },
        { to: '/tickets', icon: Ticket, label: 'Chat do Projeto' },
        { to: '/documents', icon: FolderOpen, label: 'Documentos' },
        { to: '/reports', icon: FileText, label: 'Relatórios' },
        { to: '/notifications', icon: Bell, label: 'Notificações' },
        ...(user?.role === 'admin'
          ? [
              { to: '/adm', icon: ShieldCheck, label: 'Clientes' },
              { to: '/usuarios', icon: Users, label: 'Usuarios e Acessos' },
            ]
          : []),
      ]
    : [
        { to: '/cliente', icon: LayoutDashboard, label: 'Portal do Cliente' },
        { to: '/sprints', icon: BarChart3, label: 'Cronograma de Sprints' },
        { to: '/meetings', icon: CalendarDays, label: 'Agenda' },
        { to: '/tickets', icon: Ticket, label: 'Chat do Projeto' },
        { to: '/documents', icon: FolderOpen, label: 'Documentos' },
        { to: '/reports', icon: FileText, label: 'Relatórios' },
        { to: '/notifications', icon: Bell, label: 'Notificações' },
      ];

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-72'} bg-white/95 border-r border-gray-200 dark:bg-slate-950/95 dark:border-slate-800 flex flex-col transition-all duration-300 min-h-screen backdrop-blur`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/favicon/favicon.svg" alt="Wayzen" className="w-9 h-9 rounded-xl" />
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-none">Wayzen</p>
              <span className="font-semibold text-wayzen-700 dark:text-wayzen-300 leading-none">Client Portal</span>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-700 dark:text-slate-200">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pt-3">
          <ThemeToggle />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={`${item.to}-${item.label}`}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-wayzen-50 to-[#eef0ff] text-brand-midnight border border-wayzen-200'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
              }`
            }
          >
            <item.icon size={20} />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {item.to === '/notifications' && unreadNotificationsCount > 0 && (
              <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-wayzen-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-gray-200 dark:border-slate-800 p-3">
        {!collapsed && user && (
          <div className="mb-2 px-2 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
            <span className="badge badge-purple mt-1">
              {user.role === 'admin' ? 'Admin' : user.role === 'consultant' ? 'Consultor' : 'Cliente'}
            </span>
          </div>
        )}
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 w-full transition-colors">
          <LogOut size={18} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
