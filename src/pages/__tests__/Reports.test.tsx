import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Reports from '@/pages/Reports';
import { portalService } from '@/lib/services/portal';

const formatPtBrDate = (isoDate: string) => new Date(`${isoDate}T00:00:00`).toLocaleDateString('pt-BR');

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const aggregateSnapshotView = (rows: any[]) => {
  if (!rows.length) {
    return {
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
    };
  }

  const sum = (key: string) => rows.reduce((acc, row) => acc + toNumber(row[key]), 0);
  const avg = (key: string) => sum(key) / rows.length;
  const latest = rows[0];

  const contatoInicial = Math.round(avg('opportunities_contato_inicial'));
  const qualificado = Math.round(avg('opportunities_qualificado'));
  const propostaEnviada = Math.round(avg('opportunities_proposta_enviada'));
  const negociacao = Math.round(avg('opportunities_negociacao'));
  const fechado = Math.round(avg('opportunities_fechado'));

  return {
    slaFirstResponseMinutes: Number(avg('sla_first_response_minutes').toFixed(1)),
    leadsToday: Math.round(sum('leads_whatsapp') + sum('leads_instagram') + sum('leads_site') + sum('leads_referral')),
    leadsUnanswered: Math.round(avg('leads_unanswered')),
    opportunitiesOpen: contatoInicial + qualificado + propostaEnviada + negociacao + fechado,
    opportunitiesByStage: { contatoInicial, qualificado, propostaEnviada, negociacao, fechado },
    followUpsDone: Math.round(sum('followups_done')),
    followUpsOverdue: Math.round(avg('followups_overdue')),
    conversionRateWeek: Number(avg('conversion_rate_week').toFixed(2)),
    enrollmentsMonth: Math.round(avg('enrollments_month')),
    loaRevenueMonth: Number(avg('loa_revenue_month').toFixed(2)),
    avgTicket: Number(avg('avg_ticket').toFixed(2)),
    monthlyGoal: Number(avg('monthly_goal').toFixed(2)),
    monthlyRealized: Number(avg('monthly_realized').toFixed(2)),
    churnMonth: Math.round(avg('churn_month')),
    delinquencyRate: Number(avg('delinquency_rate').toFixed(2)),
    nps: Number(avg('nps_weekly').toFixed(0)),
    wayzenActivitiesToday: Math.round(sum('wayzen_activities_today')),
    weekOverWeekConversionVar: Number(avg('wow_conversion_var').toFixed(2)),
    baseline: {
      conversionRate: toNumber(latest.baseline_conversion_rate),
      monthlyRevenue: toNumber(latest.baseline_monthly_revenue),
      avgTicket: toNumber(latest.baseline_avg_ticket),
    },
    current: {
      conversionRate: toNumber(latest.current_conversion_rate),
      monthlyRevenue: toNumber(latest.current_monthly_revenue),
      avgTicket: toNumber(latest.current_avg_ticket),
    },
  };
};

const buildAnalyticsForSnapshots = (snapshots: any[]) => {
  const ordered = [...snapshots].sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date));
  const latestDate = ordered[0]?.snapshot_date;
  const latestDateObj = latestDate ? new Date(`${latestDate}T00:00:00`) : new Date();
  const weekStart = new Date(latestDateObj);
  weekStart.setDate(weekStart.getDate() - 6);

  const weekRows = ordered.filter((row) => {
    const d = new Date(`${row.snapshot_date}T00:00:00`);
    return d >= weekStart && d <= latestDateObj;
  });
  const monthRows = ordered.filter((row) => {
    const d = new Date(`${row.snapshot_date}T00:00:00`);
    return d.getFullYear() === latestDateObj.getFullYear() && d.getMonth() === latestDateObj.getMonth();
  });

  return {
    marketing: [],
    sales: [],
    correlation: [],
    funnel: [],
    strategic: {
      today: aggregateSnapshotView(ordered.length ? [ordered[0]] : []),
      week: aggregateSnapshotView(weekRows),
      month: aggregateSnapshotView(monthRows),
    },
    trends: {
      weekOverWeekConversion: [...ordered]
        .reverse()
        .map((row) => ({ label: formatPtBrDate(row.snapshot_date), value: toNumber(row.conversion_rate_week) })),
      beforeAfterWayzen: ordered.length
        ? [
            {
              label: 'Conversao (%)',
              before: toNumber(ordered[0].baseline_conversion_rate),
              after: toNumber(ordered[0].current_conversion_rate),
            },
            {
              label: 'Receita mensal',
              before: toNumber(ordered[0].baseline_monthly_revenue),
              after: toNumber(ordered[0].current_monthly_revenue),
            },
            {
              label: 'Ticket medio',
              before: toNumber(ordered[0].baseline_avg_ticket),
              after: toNumber(ordered[0].current_avg_ticket),
            },
          ]
        : [],
    },
  };
};

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
    expect(screen.getByRole('button', { name: /^Registro Diario$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Relatorios Publicados/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Registro Diario$/i }));
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

  it('valida fluxo completo do Registro Diario: persistencia, analytics, filtros, graficos e multiplos registros', async () => {
    const today = new Date();
    const date1 = new Date(today);
    date1.setDate(today.getDate() - 3);
    const date2 = new Date(today);

    const iso1 = date1.toISOString().slice(0, 10);
    const iso2 = date2.toISOString().slice(0, 10);

    let logId = 300;
    let snapshotId = 500;

    const dailyLogsStore: any[] = [];
    const snapshotStore: any[] = [];

    vi.mocked(portalService.getReports).mockResolvedValue([]);
    vi.mocked(portalService.getDailyLogs).mockImplementation(async () => [...dailyLogsStore].sort((a, b) => b.log_date.localeCompare(a.log_date)));
    vi.mocked(portalService.getDailyOperationalSnapshots).mockImplementation(async () => [...snapshotStore].sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date)));
    vi.mocked(portalService.getAnalyticsData).mockImplementation(async () => buildAnalyticsForSnapshots(snapshotStore));

    vi.mocked(portalService.createDailyLog).mockImplementation(async (payload: any) => {
      const row = {
        id: logId++,
        client_id: payload.clientId,
        consultant_user_id: 2,
        log_date: payload.logDate,
        progress_score: payload.progressScore,
        hours_worked: payload.hoursWorked,
        summary: payload.summary,
        blockers: payload.blockers || null,
        next_steps: payload.nextSteps || null,
        created_at: new Date().toISOString(),
      };
      dailyLogsStore.push(row);
      return row;
    });

    vi.mocked(portalService.upsertDailyOperationalSnapshot).mockImplementation(async (payload: any) => {
      const existingIndex = snapshotStore.findIndex((row) => row.snapshot_date === payload.snapshotDate);
      const nextRow = {
        id: existingIndex >= 0 ? snapshotStore[existingIndex].id : snapshotId++,
        client_id: payload.clientId,
        snapshot_date: payload.snapshotDate,
        sla_first_response_minutes: payload.slaFirstResponseMinutes,
        leads_whatsapp: payload.leadsWhatsapp,
        leads_instagram: payload.leadsInstagram,
        leads_site: payload.leadsSite,
        leads_referral: payload.leadsReferral,
        leads_unanswered: payload.leadsUnanswered,
        opportunities_contato_inicial: payload.opportunitiesContatoInicial,
        opportunities_qualificado: payload.opportunitiesQualificado,
        opportunities_proposta_enviada: payload.opportunitiesPropostaEnviada,
        opportunities_negociacao: payload.opportunitiesNegociacao,
        opportunities_fechado: payload.opportunitiesFechado,
        followups_done: payload.followupsDone,
        followups_overdue: payload.followupsOverdue,
        conversion_rate_week: payload.conversionRateWeek,
        enrollments_month: payload.enrollmentsMonth,
        loa_revenue_month: payload.loaRevenueMonth,
        avg_ticket: payload.avgTicket,
        monthly_goal: payload.monthlyGoal,
        monthly_realized: payload.monthlyRealized,
        churn_month: payload.churnMonth,
        delinquency_rate: payload.delinquencyRate,
        nps_weekly: payload.npsWeekly,
        wayzen_activities_today: payload.wayzenActivitiesToday,
        wow_conversion_var: payload.wowConversionVar,
        baseline_conversion_rate: payload.baselineConversionRate,
        baseline_monthly_revenue: payload.baselineMonthlyRevenue,
        baseline_avg_ticket: payload.baselineAvgTicket,
        current_conversion_rate: payload.currentConversionRate,
        current_monthly_revenue: payload.currentMonthlyRevenue,
        current_avg_ticket: payload.currentAvgTicket,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingIndex >= 0) snapshotStore[existingIndex] = nextRow;
      else snapshotStore.push(nextRow);
      return nextRow;
    });

    const { unmount } = render(<Reports />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Registro Diario$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Registro Diario$/i }));

    const fillSnapshotForm = (data: Record<string, number>) => {
      const labelValuePairs: Array<[RegExp, number]> = [
        [/SLA \(min\)/i, data.sla],
        [/Leads \(WhatsApp\)/i, data.leadsWhatsapp],
        [/Leads \(Instagram\)/i, data.leadsInstagram],
        [/Leads \(Site\)/i, data.leadsSite],
        [/Leads \(Indicacao\)/i, data.leadsReferral],
        [/Sem resposta/i, data.leadsUnanswered],
        [/Funil: contato inicial/i, data.contatoInicial],
        [/Funil: qualificado/i, data.qualificado],
        [/Funil: proposta enviada/i, data.proposta],
        [/Funil: negociacao/i, data.negociacao],
        [/Funil: fechado/i, data.fechado],
        [/Follow-ups \(realizados\)/i, data.followupsDone],
        [/Follow-ups \(em atraso\)/i, data.followupsOverdue],
        [/Conversao semana \(%\)/i, data.conversionWeek],
        [/Matriculas mes/i, data.enrollments],
        [/LOA parcial \(R\$\)/i, data.loa],
        [/Ticket medio \(R\$\)/i, data.avgTicket],
        [/Meta mensal \(R\$\)/i, data.monthlyGoal],
        [/Realizado mensal \(R\$\)/i, data.monthlyRealized],
        [/Desistencias mes/i, data.churn],
        [/Inadimplencia \(%\)/i, data.delinquency],
        [/NPS semanal/i, data.nps],
        [/Atividades Wayzen hoje/i, data.wayzenActivities],
        [/Variacao WoW conversao \(%\)/i, data.wow],
        [/Antes Wayzen: conversao \(%\)/i, data.baselineConversion],
        [/Antes Wayzen: receita mensal/i, data.baselineRevenue],
        [/Antes Wayzen: ticket medio/i, data.baselineTicket],
        [/Hoje: conversao \(%\)/i, data.currentConversion],
        [/Hoje: receita mensal/i, data.currentRevenue],
        [/Hoje: ticket medio/i, data.currentTicket],
      ];

      labelValuePairs.forEach(([labelRegex, value]) => {
        fireEvent.change(screen.getByLabelText(labelRegex), { target: { value: String(value) } });
      });
    };

    fireEvent.change(screen.getByLabelText(/Data do registro/i), { target: { value: iso1 } });
    fireEvent.change(screen.getByLabelText(/Progresso do dia/i), { target: { value: '85' } });
    fireEvent.change(screen.getByLabelText(/Horas trabalhadas/i), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/Resumo do dia/i), { target: { value: 'Primeiro registro operacional completo.' } });
    fillSnapshotForm({
      sla: 4,
      leadsWhatsapp: 50,
      leadsInstagram: 10,
      leadsSite: 4,
      leadsReferral: 2,
      leadsUnanswered: 5,
      contatoInicial: 10,
      qualificado: 8,
      proposta: 6,
      negociacao: 4,
      fechado: 3,
      followupsDone: 12,
      followupsOverdue: 2,
      conversionWeek: 10,
      enrollments: 3,
      loa: 15000,
      avgTicket: 5000,
      monthlyGoal: 30000,
      monthlyRealized: 15000,
      churn: 1,
      delinquency: 3,
      nps: 80,
      wayzenActivities: 15,
      wow: 2,
      baselineConversion: 6,
      baselineRevenue: 12000,
      baselineTicket: 4000,
      currentConversion: 10,
      currentRevenue: 15000,
      currentTicket: 5000,
    });

    fireEvent.click(screen.getByRole('button', { name: /Salvar registro diario/i }));

    await waitFor(() => {
      expect(screen.getByText(/Primeiro registro operacional completo\./i)).toBeInTheDocument();
      expect(screen.getByText('66')).toBeInTheDocument();
      expect(screen.getByText('4.0')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analytics/i }));

    await waitFor(() => {
      expect(screen.getByText('4.0 min')).toBeInTheDocument();
      expect(screen.getByText('66')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getAllByText(/R\$ 15\.000/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/R\$ 5\.000/i).length).toBeGreaterThan(0);
      expect(screen.getByText('3.0%')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('2.00%')).toBeInTheDocument();
      expect(screen.getByText('10.00%')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Nenhum dado registrado ainda\. Preencha o Registro Diario para visualizar\./i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Registro Diario$/i }));
    fireEvent.change(screen.getByLabelText(/Data do registro/i), { target: { value: iso2 } });
    fireEvent.change(screen.getByLabelText(/Resumo do dia/i), { target: { value: 'Segundo registro com alteracao de indicadores.' } });
    fillSnapshotForm({
      sla: 2,
      leadsWhatsapp: 40,
      leadsInstagram: 8,
      leadsSite: 4,
      leadsReferral: 3,
      leadsUnanswered: 1,
      contatoInicial: 14,
      qualificado: 11,
      proposta: 8,
      negociacao: 5,
      fechado: 4,
      followupsDone: 18,
      followupsOverdue: 1,
      conversionWeek: 14,
      enrollments: 5,
      loa: 25000,
      avgTicket: 6200,
      monthlyGoal: 30000,
      monthlyRealized: 25000,
      churn: 0,
      delinquency: 2,
      nps: 88,
      wayzenActivities: 22,
      wow: 4,
      baselineConversion: 6,
      baselineRevenue: 12000,
      baselineTicket: 4000,
      currentConversion: 14,
      currentRevenue: 25000,
      currentTicket: 6200,
    });

    fireEvent.click(screen.getByRole('button', { name: /Salvar registro diario/i }));

    await waitFor(() => {
      expect(screen.getByText(/Primeiro registro operacional completo\./i)).toBeInTheDocument();
      expect(screen.getByText(/Segundo registro com alteracao de indicadores\./i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analytics/i }));

    await waitFor(() => {
      expect(screen.getByText('2.0 min')).toBeInTheDocument();
      expect(screen.getByText('55')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getAllByText(/R\$ 25\.000/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/R\$ 6\.200/i).length).toBeGreaterThan(0);
      expect(screen.getByText('2.0%')).toBeInTheDocument();
      expect(screen.getByText('88')).toBeInTheDocument();
      expect(screen.getByText('22')).toBeInTheDocument();
      expect(screen.getByText('4.00%')).toBeInTheDocument();
      expect(screen.getByText('14.00%')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Semana/i }));
    await waitFor(() => {
      expect(screen.getByText('3.0 min')).toBeInTheDocument();
      expect(screen.getByText('121')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Mes/i }));
    await waitFor(() => {
      expect(screen.getByText('3.0 min')).toBeInTheDocument();
    });

    unmount();
    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Registro Diario$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Registro Diario$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Primeiro registro operacional completo\./i)).toBeInTheDocument();
      expect(screen.getByText(/Segundo registro com alteracao de indicadores\./i)).toBeInTheDocument();
    });
  });
});
