import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { usePortalScope } from '@/hooks/usePortalScope';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import PortalSelect from '@/pages/PortalSelect';
import Dashboard from '@/pages/Dashboard';
import Sprints from '@/pages/Sprints';
import Kanban from '@/pages/Kanban';
import Tickets from '@/pages/Tickets';
import Documents from '@/pages/Documents';
import Reports from '@/pages/Reports';
import Notifications from '@/pages/Notifications';
import ClientPortals from '@/pages/ClientPortals';
import Meetings from '@/pages/Meetings';
import Cliente from '@/pages/Cliente';
import Consultor from '@/pages/Consultor';
import Adm from '@/pages/Adm';
import Usuarios from '@/pages/Usuarios';
import PageLoader from '@/components/PageLoader';
import { ThemeProvider } from '@/hooks/useTheme';

function getDefaultRouteByRole(role?: 'admin' | 'consultant' | 'client') {
  if (role === 'admin') return '/adm';
  if (role === 'consultant') return '/consultor';
  return '/cliente';
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PortalGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { activeClientId, loadingClients, isInternal } = usePortalScope();

  if (loadingClients) return <PageLoader fullScreen />;

  if (isInternal && user && !activeClientId) {
    return <Navigate to="/portal-select" replace />;
  }

  return <>{children}</>;
}

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'consultant' | 'client'>;
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }
  return <>{children}</>;
}

function RoleHomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
}

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <PageLoader fullScreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={getDefaultRouteByRole(user?.role)} replace /> : <Login />}
      />
      <Route
        path="/portal-select"
        element={
          <ProtectedRoute>
            <PortalSelect />
          </ProtectedRoute>
        }
      />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route path="/cliente" element={<RoleRoute allowedRoles={['client']}><PortalGuard><Cliente /></PortalGuard></RoleRoute>} />
        <Route path="/consultor" element={<RoleRoute allowedRoles={['consultant']}><Consultor /></RoleRoute>} />
        <Route path="/adm" element={<RoleRoute allowedRoles={['admin']}><Adm /></RoleRoute>} />
        <Route path="/usuarios" element={<RoleRoute allowedRoles={['admin']}><Usuarios /></RoleRoute>} />
        <Route path="/sprints" element={<PortalGuard><Sprints /></PortalGuard>} />
        <Route path="/kanban" element={<RoleRoute allowedRoles={['admin', 'consultant']}><PortalGuard><Kanban /></PortalGuard></RoleRoute>} />
        <Route path="/tickets" element={<PortalGuard><Tickets /></PortalGuard>} />
        <Route path="/documents" element={<PortalGuard><Documents /></PortalGuard>} />
        <Route path="/reports" element={<PortalGuard><Reports /></PortalGuard>} />
        <Route path="/notifications" element={<PortalGuard><Notifications /></PortalGuard>} />
        <Route path="/portals" element={<RoleRoute allowedRoles={['admin', 'consultant']}><PortalGuard><ClientPortals /></PortalGuard></RoleRoute>} />
        <Route path="/meetings" element={<PortalGuard><Meetings /></PortalGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
