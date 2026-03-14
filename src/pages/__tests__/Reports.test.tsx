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
      snapshotSeries: [...ordered].reverse().map((row) => ({
        date: formatPtBrDate(row.snapshot_date),
        whatsapp: toNumber(row.leads_whatsapp),
        instagram: toNumber(row.leads_instagram),
        site: toNumber(row.leads_site),
        referral: toNumber(row.leads_referral),
        unanswered: toNumber(row.leads_unanswered),
        wowConversionVar: toNumber(row.wow_conversion_var),
      })),
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
        snapshotSeries: [],
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
        snapshotSeries: [],
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
      expect(screen.getByText(/Grupo 1 — Velocidade e Resposta/i)).toBeInTheDocument();
      expect(screen.getByText(/Grupo 2 — Funil Ativo/i)).toBeInTheDocument();
      expect(screen.getByText(/Grupo 3 — Resultado Financeiro/i)).toBeInTheDocument();
      expect(screen.getByText(/Grupo 4 — Saude da Base/i)).toBeInTheDocument();
      expect(screen.getByText(/Grupo 5 — Operacao Wayzen/i)).toBeInTheDocument();
      expect(screen.getByText(/Variação de Conversão Semana a Semana/i)).toBeInTheDocument();
      expect(screen.getByText(/Antes vs Depois da Wayzen/i)).toBeInTheDocument();
    });

    expect(screen.queryAllByText(/Nenhum dado registrado ainda\. Preencha o Registro Diario para visualizar\./i).length).toBe(0);

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
      expect(screen.getByText(/Variação de Conversão Semana a Semana/i)).toBeInTheDocument();
      expect(screen.getByText(/Antes vs Depois da Wayzen/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Semana$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Grupo 1 — Velocidade e Resposta/i)).toBeInTheDocument();
      expect(screen.getByText(/Variação de Conversão Semana a Semana/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Mes$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Grupo 5 — Operacao Wayzen/i)).toBeInTheDocument();
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

  it('salva o mesmo dia duas vezes sem erro e atualiza o registro existente com feedback visual', async () => {
    const sameDate = new Date().toISOString().slice(0, 10);
    const dailyLogsStore: any[] = [];
    const snapshotStore: any[] = [];

    vi.mocked(portalService.getReports).mockResolvedValue([]);
    vi.mocked(portalService.getDailyLogs).mockImplementation(async () => [...dailyLogsStore]);
    vi.mocked(portalService.getDailyOperationalSnapshots).mockImplementation(async () => [...snapshotStore]);
    vi.mocked(portalService.getAnalyticsData).mockImplementation(async () => buildAnalyticsForSnapshots(snapshotStore));

    vi.mocked(portalService.createDailyLog).mockImplementation(async (payload: any) => {
      const existingIndex = dailyLogsStore.findIndex((row) => row.log_date === payload.logDate);
      const row = {
        id: existingIndex >= 0 ? dailyLogsStore[existingIndex].id : 901,
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

      if (existingIndex >= 0) dailyLogsStore[existingIndex] = row;
      else dailyLogsStore.push(row);
      return row;
    });

    vi.mocked(portalService.upsertDailyOperationalSnapshot).mockImplementation(async (payload: any) => {
      const existingIndex = snapshotStore.findIndex((row) => row.snapshot_date === payload.snapshotDate);
      const row = {
        id: existingIndex >= 0 ? snapshotStore[existingIndex].id : 1001,
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

      if (existingIndex >= 0) snapshotStore[existingIndex] = row;
      else snapshotStore.push(row);
      return row;
    });

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Registro Diario$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Registro Diario$/i }));

    fireEvent.change(screen.getByLabelText(/Data do registro/i), { target: { value: sameDate } });
    fireEvent.change(screen.getByLabelText(/Resumo do dia/i), { target: { value: 'Primeira versao do dia' } });
    fireEvent.change(screen.getByLabelText(/SLA \(min\)/i), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar registro diario/i }));

    await waitFor(() => {
      expect(screen.getByText(/Registro salvo com sucesso!/i)).toBeInTheDocument();
      expect(screen.getByText(/Primeira versao do dia/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Resumo do dia/i), { target: { value: 'Versao atualizada do mesmo dia' } });
    fireEvent.change(screen.getByLabelText(/SLA \(min\)/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar registro diario/i }));

    await waitFor(() => {
      expect(screen.getByText(/Registro salvo com sucesso!/i)).toBeInTheDocument();
      expect(screen.getByText(/Versao atualizada do mesmo dia/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Primeira versao do dia/i)).not.toBeInTheDocument();
    expect(dailyLogsStore).toHaveLength(1);
    expect(snapshotStore).toHaveLength(1);
  });

  it('renderiza analytics com 5 registros e responde aos filtros Hoje, Semana e Mes', async () => {
    const now = new Date();
    const dates = [0, 1, 2, 3, 4].map((delta) => {
      const d = new Date(now);
      d.setDate(now.getDate() - delta);
      return d.toISOString().slice(0, 10);
    });

    const dailyLogsStore: any[] = [];
    const snapshotStore: any[] = [];
    let idSeed = 1200;

    vi.mocked(portalService.getReports).mockResolvedValue([]);
    vi.mocked(portalService.getDailyLogs).mockImplementation(async () => [...dailyLogsStore].sort((a, b) => b.log_date.localeCompare(a.log_date)));
    vi.mocked(portalService.getDailyOperationalSnapshots).mockImplementation(async () => [...snapshotStore].sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date)));
    vi.mocked(portalService.getAnalyticsData).mockImplementation(async () => buildAnalyticsForSnapshots(snapshotStore));

    vi.mocked(portalService.createDailyLog).mockImplementation(async (payload: any) => {
      const row = {
        id: idSeed++,
        client_id: payload.clientId,
        consultant_user_id: 2,
        log_date: payload.logDate,
        progress_score: payload.progressScore,
        hours_worked: payload.hoursWorked,
        summary: payload.summary,
        blockers: null,
        next_steps: null,
        created_at: new Date().toISOString(),
      };
      dailyLogsStore.push(row);
      return row;
    });

    vi.mocked(portalService.upsertDailyOperationalSnapshot).mockImplementation(async (payload: any) => {
      const row = {
        id: idSeed++,
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
      snapshotStore.push(row);
      return row;
    });

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Registro Diario$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Registro Diario$/i }));

    for (let i = 0; i < dates.length; i += 1) {
      fireEvent.change(screen.getByLabelText(/Data do registro/i), { target: { value: dates[i] } });
      fireEvent.change(screen.getByLabelText(/Resumo do dia/i), { target: { value: `Registro ${i + 1}` } });
      fireEvent.change(screen.getByLabelText(/SLA \(min\)/i), { target: { value: String(2 + i) } });
      fireEvent.change(screen.getByLabelText(/Leads \(WhatsApp\)/i), { target: { value: String(20 + i * 2) } });
      fireEvent.change(screen.getByLabelText(/Leads \(Instagram\)/i), { target: { value: String(6 + i) } });
      fireEvent.change(screen.getByLabelText(/Leads \(Site\)/i), { target: { value: String(3 + i) } });
      fireEvent.change(screen.getByLabelText(/Leads \(Indicacao\)/i), { target: { value: String(2 + i) } });
      fireEvent.change(screen.getByLabelText(/Sem resposta/i), { target: { value: String(i % 2) } });
      fireEvent.change(screen.getByLabelText(/Funil: contato inicial/i), { target: { value: String(10 + i) } });
      fireEvent.change(screen.getByLabelText(/Funil: qualificado/i), { target: { value: String(8 + i) } });
      fireEvent.change(screen.getByLabelText(/Funil: proposta enviada/i), { target: { value: String(6 + i) } });
      fireEvent.change(screen.getByLabelText(/Funil: negociacao/i), { target: { value: String(4 + i) } });
      fireEvent.change(screen.getByLabelText(/Funil: fechado/i), { target: { value: String(2 + i) } });
      fireEvent.change(screen.getByLabelText(/Follow-ups \(realizados\)/i), { target: { value: String(12 + i) } });
      fireEvent.change(screen.getByLabelText(/Follow-ups \(em atraso\)/i), { target: { value: String(2) } });
      fireEvent.change(screen.getByLabelText(/Conversao semana/i), { target: { value: String(9 + i) } });
      fireEvent.change(screen.getByLabelText(/Matriculas mes/i), { target: { value: String(2 + i) } });
      fireEvent.change(screen.getByLabelText(/LOA parcial/i), { target: { value: String(12000 + i * 2000) } });
      fireEvent.change(screen.getByLabelText(/^Ticket medio \(R\$\)$/i), { target: { value: String(4000 + i * 300) } });
      fireEvent.change(screen.getByLabelText(/Meta mensal/i), { target: { value: '30000' } });
      fireEvent.change(screen.getByLabelText(/Realizado mensal/i), { target: { value: String(12000 + i * 2000) } });
      fireEvent.change(screen.getByLabelText(/Desistencias mes/i), { target: { value: String(i % 3) } });
      fireEvent.change(screen.getByLabelText(/Inadimplencia/i), { target: { value: String(2 + i * 0.5) } });
      fireEvent.change(screen.getByLabelText(/NPS semanal/i), { target: { value: String(70 + i) } });
      fireEvent.change(screen.getByLabelText(/Atividades Wayzen hoje/i), { target: { value: String(10 + i) } });
      fireEvent.change(screen.getByLabelText(/Variacao WoW conversao/i), { target: { value: String(1 + i * 0.3) } });
      fireEvent.change(screen.getByLabelText(/Antes Wayzen: conversao/i), { target: { value: '6' } });
      fireEvent.change(screen.getByLabelText(/Antes Wayzen: receita mensal/i), { target: { value: '12000' } });
      fireEvent.change(screen.getByLabelText(/Antes Wayzen: ticket medio/i), { target: { value: '4000' } });
      fireEvent.change(screen.getByLabelText(/Hoje: conversao/i), { target: { value: String(9 + i) } });
      fireEvent.change(screen.getByLabelText(/Hoje: receita mensal/i), { target: { value: String(12000 + i * 2000) } });
      fireEvent.change(screen.getByLabelText(/Hoje: ticket medio/i), { target: { value: String(4000 + i * 300) } });
      fireEvent.click(screen.getByRole('button', { name: /Salvar registro diario/i }));
    }

    await waitFor(() => {
      expect(dailyLogsStore).toHaveLength(5);
      expect(snapshotStore).toHaveLength(5);
    });

    fireEvent.click(screen.getByRole('button', { name: /^Analytics$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Variação de Conversão Semana a Semana/i)).toBeInTheDocument();
      expect(screen.getByText(/Antes vs Depois da Wayzen/i)).toBeInTheDocument();
      expect(screen.queryAllByText(/Nenhum dado registrado ainda\. Preencha o Registro Diario para visualizar\./i).length).toBe(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /Semana/i }));
    await waitFor(() => {
      expect(screen.getByText(/Grupo 1 — Velocidade e Resposta/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Mes/i }));
    await waitFor(() => {
      expect(screen.getByText(/Grupo 5 — Operacao Wayzen/i)).toBeInTheDocument();
    });
  });
});
