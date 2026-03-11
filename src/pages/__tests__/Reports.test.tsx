import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Reports from '@/pages/Reports';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Administrador', role: 'admin' },
    isAuthenticated: true,
  }),
}));

vi.mock('@/hooks/usePortalScope', () => ({
  usePortalScope: () => ({
    isInternal: true,
    activeClientId: 1,
    activeClient: { company_name: 'Escola ABC Educacao' },
    loadingClients: false,
  }),
}));

vi.mock('@/lib/services/portal', () => ({
  portalService: {
    getReports: vi.fn().mockResolvedValue([
      {
        id: 10,
        title: 'Relatorio mensal',
        type: 'monthly',
        period_start: '2026-03-01',
        period_end: '2026-03-31',
        content: 'Resumo de entregas.',
        metrics: { notas: 'ok' },
        author_name: 'Admin',
        created_at: new Date().toISOString(),
      },
    ]),
    getDailyLogs: vi.fn().mockResolvedValue([
      {
        id: 1,
        client_id: 1,
        consultant_user_id: 2,
        log_date: '2026-03-10',
        progress_score: 78,
        hours_worked: 8,
        summary: 'Acompanhamento de sprint',
        blockers: null,
        next_steps: 'Revisar backlog',
        created_at: new Date().toISOString(),
      },
    ]),
    getAnalyticsData: vi.fn().mockResolvedValue({
      marketing: [{ period: 'mar', leads: 12, costPerLead: 50, activeCampaigns: 2, conversionRate: 3.2 }],
      sales: [{ period: 'mar', meetings: 4, proposals: 2, dealsClosed: 1, averageTicket: 1000 }],
      correlation: [{ label: 'mar', leads: 12, deals: 1 }],
      funnel: [{ stage: 'Leads', value: 12 }],
    }),
    getChatContacts: vi.fn().mockResolvedValue([
      { id: 2, name: 'Carla', role: 'consultant' },
    ]),
    createDailyLog: vi.fn().mockResolvedValue({ success: true }),
    createReport: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Reports hub', () => {
  it('renderiza abas internas de analytics, registro diario e relatorios publicados', async () => {
    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText(/Hub de Relatorios e Analytics/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registro Diario/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Relatorios Publicados/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Registro Diario/i }));
    expect(screen.getByText(/Historico de Operacao/i)).toBeInTheDocument();
  });
});
