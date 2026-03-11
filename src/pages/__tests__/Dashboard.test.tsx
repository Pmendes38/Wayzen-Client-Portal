import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from '@/pages/Dashboard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Administrador' } }),
}));

vi.mock('@/hooks/usePortalScope', () => ({
  usePortalScope: () => ({
    isInternal: true,
    activeClient: { company_name: 'Escola ABC Educacao' },
    activeClientId: 1,
    loadingClients: false,
  }),
}));

vi.mock('@/lib/queries', () => ({
  getDashboardData: vi.fn().mockResolvedValue({
    client: { company_name: 'Escola ABC Educacao' },
    openTickets: 3,
    totalDocuments: 8,
    totalReports: 6,
    recentUpdates: [{ id: 1, title: 'Reuniao semanal', content: 'ok', type: 'update', created_at: new Date().toISOString() }],
    activeSprints: [
      { id: 1, name: 'Sprint 15', status: 'in_progress', start_date: '2026-03-01', end_date: '2026-03-10' },
    ],
    sprintProgress: { completed: 7, total: 10 },
  }),
}));

describe('Dashboard operacional', () => {
  it('renderiza os blocos principais da nova estrutura', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Olá, Administrador!/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Resumo da conclusao das sprints/i)).toBeInTheDocument();
    expect(screen.getByText(/Grafico resumo de vendas no mes/i)).toBeInTheDocument();
    expect(screen.getByText(/Grafico resumo de vendas no dia/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Calendario Interativo/i })).toBeInTheDocument();
  });
});
