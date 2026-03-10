import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { usePortalScope } from '@/hooks/usePortalScope';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import PortalSelect from '@/pages/PortalSelect';
import Dashboard from '@/pages/Dashboard';
import Sprints from '@/pages/Sprints';
import Tickets from '@/pages/Tickets';
import Documents from '@/pages/Documents';
import Reports from '@/pages/Reports';
import Notifications from '@/pages/Notifications';
import ClientPortals from '@/pages/ClientPortals';
import DailyLogs from '@/pages/DailyLogs';
import Meetings from '@/pages/Meetings';
import PageLoader from '@/components/PageLoader';

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

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader fullScreen />;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/portal-select"
        element={
          <ProtectedRoute>
            <PortalSelect />
          </ProtectedRoute>
        }
      />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<PortalGuard><Dashboard /></PortalGuard>} />
        <Route path="/sprints" element={<PortalGuard><Sprints /></PortalGuard>} />
        <Route path="/tickets" element={<PortalGuard><Tickets /></PortalGuard>} />
        <Route path="/documents" element={<PortalGuard><Documents /></PortalGuard>} />
        <Route path="/reports" element={<PortalGuard><Reports /></PortalGuard>} />
        <Route path="/notifications" element={<PortalGuard><Notifications /></PortalGuard>} />
        <Route path="/portals" element={<PortalGuard><ClientPortals /></PortalGuard>} />
        <Route path="/daily-logs" element={<PortalGuard><DailyLogs /></PortalGuard>} />
        <Route path="/meetings" element={<PortalGuard><Meetings /></PortalGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
