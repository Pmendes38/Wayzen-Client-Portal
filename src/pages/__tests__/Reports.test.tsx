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
      strategic: {
        today: {
          slaFirstResponseMinutes: 3,
          leadsToday: 10,
          leadsUnanswered: 0,
          opportunitiesOpen: 8,
          opportunitiesByStage: { contatoInicial: 2, qualificado: 2, propostaEnviada: 2, negociacao: 1, fechado: 1 },
          followUpsDone: 6,
          followUpsOverdue: 1,
          conversionRateWeek: 12,
          enrollmentsMonth: 5,
          loaRevenueMonth: 35000,
          avgTicket: 7000,
          monthlyGoal: 50000,
          monthlyRealized: 35000,
          churnMonth: 1,
          delinquencyRate: 8,
          nps: 74,
          wayzenActivitiesToday: 14,
          weekOverWeekConversionVar: 2.2,
          baseline: { conversionRate: 7, monthlyRevenue: 21000, avgTicket: 4200 },
          current: { conversionRate: 12, monthlyRevenue: 35000, avgTicket: 7000 },
        },
        week: {
          slaFirstResponseMinutes: 3,
          leadsToday: 60,
          leadsUnanswered: 2,
          opportunitiesOpen: 20,
          opportunitiesByStage: { contatoInicial: 6, qualificado: 5, propostaEnviada: 4, negociacao: 3, fechado: 2 },
          followUpsDone: 30,
          followUpsOverdue: 4,
          conversionRateWeek: 12,
          enrollmentsMonth: 5,
          loaRevenueMonth: 35000,
          avgTicket: 7000,
          monthlyGoal: 50000,
          monthlyRealized: 35000,
          churnMonth: 1,
          delinquencyRate: 8,
          nps: 74,
          wayzenActivitiesToday: 60,
          weekOverWeekConversionVar: 2.2,
          baseline: { conversionRate: 7, monthlyRevenue: 21000, avgTicket: 4200 },
          current: { conversionRate: 12, monthlyRevenue: 35000, avgTicket: 7000 },
        },
        month: {
          slaFirstResponseMinutes: 4,
          leadsToday: 200,
          leadsUnanswered: 5,
          opportunitiesOpen: 42,
          opportunitiesByStage: { contatoInicial: 11, qualificado: 10, propostaEnviada: 9, negociacao: 7, fechado: 5 },
          followUpsDone: 120,
          followUpsOverdue: 9,
          conversionRateWeek: 12,
          enrollmentsMonth: 5,
          loaRevenueMonth: 35000,
          avgTicket: 7000,
          monthlyGoal: 50000,
          monthlyRealized: 35000,
          churnMonth: 1,
          delinquencyRate: 8,
          nps: 74,
          wayzenActivitiesToday: 220,
          weekOverWeekConversionVar: 2.2,
          baseline: { conversionRate: 7, monthlyRevenue: 21000, avgTicket: 4200 },
          current: { conversionRate: 12, monthlyRevenue: 35000, avgTicket: 7000 },
        },
      },
      trends: {
        weekOverWeekConversion: [{ label: '10/03', value: 11.5 }],
        beforeAfterWayzen: [{ label: 'Conversao (%)', before: 7, after: 12 }],
      },
    }),
    getChatContacts: vi.fn().mockResolvedValue([
      { id: 2, name: 'Carla', role: 'consultant' },
    ]),
    createDailyLog: vi.fn().mockResolvedValue({ success: true }),
    getDailyOperationalSnapshots: vi.fn().mockResolvedValue([]),
    upsertDailyOperationalSnapshot: vi.fn().mockResolvedValue({ success: true }),
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
