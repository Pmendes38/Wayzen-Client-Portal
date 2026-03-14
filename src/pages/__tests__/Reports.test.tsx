import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Reports from '@/pages/Reports';
import { portalService } from '@/lib/services/portal';

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('mostra empty state nos graficos e navega para Registro Diario pelo CTA', async () => {
    vi.mocked(portalService.getAnalyticsData).mockResolvedValueOnce({
      marketing: [],
      sales: [],
      correlation: [],
      funnel: [],
      strategic: {
        today: {
          slaFirstResponseMinutes: 0,
          leadsToday: 0,
          leadsUnanswered: 0,
          opportunitiesOpen: 0,
          opportunitiesByStage: { contatoInicial: 0, qualificado: 0, propostaEnviada: 0, negociacao: 0, fechado: 0 },
          followUpsDone: 0,
          followUpsOverdue: 0,
          conversionRateWeek: 0,
          enrollmentsMonth: 0,
          loaRevenueMonth: 0,
          avgTicket: 0,
          monthlyGoal: 0,
          monthlyRealized: 0,
          churnMonth: 0,
          delinquencyRate: 0,
          nps: 0,
          wayzenActivitiesToday: 0,
          weekOverWeekConversionVar: 0,
          baseline: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
          current: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
        },
        week: {
          slaFirstResponseMinutes: 0,
          leadsToday: 0,
          leadsUnanswered: 0,
          opportunitiesOpen: 0,
          opportunitiesByStage: { contatoInicial: 0, qualificado: 0, propostaEnviada: 0, negociacao: 0, fechado: 0 },
          followUpsDone: 0,
          followUpsOverdue: 0,
          conversionRateWeek: 0,
          enrollmentsMonth: 0,
          loaRevenueMonth: 0,
          avgTicket: 0,
          monthlyGoal: 0,
          monthlyRealized: 0,
          churnMonth: 0,
          delinquencyRate: 0,
          nps: 0,
          wayzenActivitiesToday: 0,
          weekOverWeekConversionVar: 0,
          baseline: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
          current: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
        },
        month: {
          slaFirstResponseMinutes: 0,
          leadsToday: 0,
          leadsUnanswered: 0,
          opportunitiesOpen: 0,
          opportunitiesByStage: { contatoInicial: 0, qualificado: 0, propostaEnviada: 0, negociacao: 0, fechado: 0 },
          followUpsDone: 0,
          followUpsOverdue: 0,
          conversionRateWeek: 0,
          enrollmentsMonth: 0,
          loaRevenueMonth: 0,
          avgTicket: 0,
          monthlyGoal: 0,
          monthlyRealized: 0,
          churnMonth: 0,
          delinquencyRate: 0,
          nps: 0,
          wayzenActivitiesToday: 0,
          weekOverWeekConversionVar: 0,
          baseline: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
          current: { conversionRate: 0, monthlyRevenue: 0, avgTicket: 0 },
        },
      },
      trends: {
        weekOverWeekConversion: [],
        beforeAfterWayzen: [],
      },
    });

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getAllByText(/Nenhum dado registrado ainda. Preencha o Registro Diario para visualizar./i).length).toBeGreaterThan(0);
    });

    const ctaButtons = screen.getAllByRole('button', { name: /Ir para Registro Diario/i });
    fireEvent.click(ctaButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Historico de Operacao/i)).toBeInTheDocument();
    });
  });

  it('preenche metricas automaticamente ao selecionar periodo em Relatorios Publicados', async () => {
    vi.mocked(portalService.getDailyOperationalSnapshots).mockResolvedValueOnce([
      {
        id: 200,
        client_id: 1,
        snapshot_date: '2026-03-10',
        sla_first_response_minutes: 4,
        leads_whatsapp: 10,
        leads_instagram: 5,
        leads_site: 3,
        leads_referral: 2,
        leads_unanswered: 2,
        opportunities_contato_inicial: 5,
        opportunities_qualificado: 4,
        opportunities_proposta_enviada: 3,
        opportunities_negociacao: 2,
        opportunities_fechado: 1,
        followups_done: 6,
        followups_overdue: 1,
        conversion_rate_week: 12.5,
        enrollments_month: 4,
        loa_revenue_month: 20000,
        avg_ticket: 5000,
        monthly_goal: 50000,
        monthly_realized: 22000,
        churn_month: 1,
        delinquency_rate: 6,
        nps_weekly: 72,
        wayzen_activities_today: 12,
        wow_conversion_var: 1.2,
        baseline_conversion_rate: 7,
        baseline_monthly_revenue: 18000,
        baseline_avg_ticket: 4500,
        current_conversion_rate: 12.5,
        current_monthly_revenue: 22000,
        current_avg_ticket: 5000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 201,
        client_id: 1,
        snapshot_date: '2026-03-12',
        sla_first_response_minutes: 6,
        leads_whatsapp: 8,
        leads_instagram: 4,
        leads_site: 2,
        leads_referral: 1,
        leads_unanswered: 1,
        opportunities_contato_inicial: 4,
        opportunities_qualificado: 3,
        opportunities_proposta_enviada: 2,
        opportunities_negociacao: 2,
        opportunities_fechado: 1,
        followups_done: 5,
        followups_overdue: 1,
        conversion_rate_week: 10.5,
        enrollments_month: 3,
        loa_revenue_month: 18000,
        avg_ticket: 4500,
        monthly_goal: 50000,
        monthly_realized: 21000,
        churn_month: 1,
        delinquency_rate: 5,
        nps_weekly: 70,
        wayzen_activities_today: 10,
        wow_conversion_var: 0.9,
        baseline_conversion_rate: 7,
        baseline_monthly_revenue: 18000,
        baseline_avg_ticket: 4500,
        current_conversion_rate: 10.5,
        current_monthly_revenue: 21000,
        current_avg_ticket: 4500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Relatorios Publicados/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Relatorios Publicados/i }));

    fireEvent.change(screen.getByLabelText(/Periodo inicial/i), {
      target: { value: '2026-03-10' },
    });
    fireEvent.change(screen.getByLabelText(/Periodo final/i), {
      target: { value: '2026-03-12' },
    });

    await waitFor(() => {
      const metricsInput = screen.getByLabelText(/Metricas-chave/i) as HTMLInputElement;
      const summaryTextarea = screen.getByLabelText(/Resumo executivo e entregas/i) as HTMLTextAreaElement;
      expect(metricsInput.value).toContain('SLA (min):');
      expect(metricsInput.value).toContain('Leads:');
      expect(summaryTextarea.value).toContain('Resumo sugerido para 2 dia(s)');
    });
  });
});
