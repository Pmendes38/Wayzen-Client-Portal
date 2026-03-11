import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-transparent text-slate-900 dark:text-slate-100">
        <div className="container py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
