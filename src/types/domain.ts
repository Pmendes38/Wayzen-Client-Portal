export type UserRole = 'admin' | 'consultant' | 'client';

export interface Client {
  id: number;
  company_name: string;
  trade_name?: string | null;
}

export interface ProjectUpdate {
  id: number;
  title: string;
  content: string;
  type: 'milestone' | 'update' | 'alert' | 'delivery';
  author_name?: string;
  created_at: string;
}

export interface Sprint {
  id: number;
  name: string;
  status: 'planned' | 'in_progress' | 'completed';
  week_number: number;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

export interface SprintTask {
  id: number;
  sprint_id: number;
  backlog_item_id?: number | null;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_completed: boolean;
  task_order?: number;
}

export interface SprintBacklogItem {
  id: number;
  client_id: number;
  sprint_id: number | null;
  title: string;
  details?: string | null;
  occurred_on?: string | null;
  due_date?: string | null;
  created_by_user_id?: number;
  created_by_name?: string | null;
  status: 'planned' | 'in_progress' | 'done';
  created_at: string;
}

export interface DashboardData {
  client: Client | null;
  openTickets: number;
  totalDocuments: number;
  totalReports: number;
  recentUpdates: ProjectUpdate[];
  activeSprints: Sprint[];
  sprintProgress: { completed: number; total: number };
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketItem {
  id: number;
  client_id: number;
  title: string;
  description?: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  is_internal: 0 | 1;
  author_name: string;
  author_role: UserRole;
  created_at: string;
}

export interface SharedDocument {
  id: number;
  title: string;
  description?: string | null;
  file_url: string;
  file_name: string;
  category?: string | null;
  uploader_name?: string;
  created_at: string;
}

export interface SharedReport {
  id: number;
  title: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'custom';
  period_start: string;
  period_end: string;
  content?: string | null;
  metrics?: string | null | Record<string, unknown>;
  author_name?: string;
  created_at: string;
}

export interface DailyLog {
  id: number;
  client_id: number;
  consultant_user_id: number;
  log_date: string;
  progress_score: number;
  hours_worked: number;
  summary: string;
  blockers?: string | null;
  next_steps?: string | null;
  created_at: string;
}

export interface MeetingEvent {
  id: number;
  client_id: number;
  title: string;
  meeting_date: string;
  meeting_type: 'meeting' | 'call';
  transcript?: string | null;
  notes?: string | null;
  created_by_user_id: number;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message?: string | null;
  type: 'ticket_update' | 'sprint_update' | 'document' | 'report' | 'system';
  is_read: 0 | 1;
  created_at: string;
}

export interface SuccessResponse {
  success: boolean;
}

export interface ChatRoom {
  id: number;
  client_id: number;
  room_type: 'general' | 'internal' | 'direct';
  name: string;
  created_at: string;
  contact_user_id?: number | null;
  contact_name?: string | null;
  contact_role?: UserRole | null;
  unread_count?: number;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  user_id: number;
  message: string;
  created_at: string;
  author_name: string;
  author_role: UserRole;
}

export interface ContactUser {
  id: number;
  name: string;
  role: UserRole;
}

export interface ProjectContact {
  id: number;
  client_id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
}

export type CalendarEventType = 'sprint_delivery' | 'meeting' | 'transcript' | 'general';

export interface ProjectCalendarEvent {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  type: CalendarEventType;
  description?: string | null;
  participant_ids?: number[];
}

export interface MarketingMetricPoint {
  period: string;
  leads: number;
  costPerLead: number;
  activeCampaigns: number;
  conversionRate: number;
}

export interface SalesMetricPoint {
  period: string;
  meetings: number;
  proposals: number;
  dealsClosed: number;
  averageTicket: number;
}

export interface CorrelationMetricPoint {
  label: string;
  leads: number;
  deals: number;
}

export interface FunnelStagePoint {
  stage: string;
  value: number;
}

export interface MarketingSalesAnalytics {
  marketing: MarketingMetricPoint[];
  sales: SalesMetricPoint[];
  correlation: CorrelationMetricPoint[];
  funnel: FunnelStagePoint[];
  strategic: {
    today: StrategicAnalyticsView;
    week: StrategicAnalyticsView;
    month: StrategicAnalyticsView;
  };
  trends: {
    weekOverWeekConversion: Array<{ label: string; value: number }>;
    beforeAfterWayzen: Array<{ label: string; before: number; after: number }>;
  };
}

export interface StrategicAnalyticsView {
  slaFirstResponseMinutes: number;
  leadsToday: number;
  leadsUnanswered: number;
  opportunitiesOpen: number;
  opportunitiesByStage: {
    contatoInicial: number;
    qualificado: number;
    propostaEnviada: number;
    negociacao: number;
    fechado: number;
  };
  followUpsDone: number;
  followUpsOverdue: number;
  conversionRateWeek: number;
  enrollmentsMonth: number;
  loaRevenueMonth: number;
  avgTicket: number;
  monthlyGoal: number;
  monthlyRealized: number;
  churnMonth: number;
  delinquencyRate: number;
  nps: number;
  wayzenActivitiesToday: number;
  weekOverWeekConversionVar: number;
  baseline: {
    conversionRate: number;
    monthlyRevenue: number;
    avgTicket: number;
  };
  current: {
    conversionRate: number;
    monthlyRevenue: number;
    avgTicket: number;
  };
}

export interface DailyOperationalSnapshot {
  id: number;
  client_id: number;
  snapshot_date: string;
  sla_first_response_minutes: number;
  leads_whatsapp: number;
  leads_instagram: number;
  leads_site: number;
  leads_referral: number;
  leads_unanswered: number;
  opportunities_contato_inicial: number;
  opportunities_qualificado: number;
  opportunities_proposta_enviada: number;
  opportunities_negociacao: number;
  opportunities_fechado: number;
  followups_done: number;
  followups_overdue: number;
  conversion_rate_week: number;
  enrollments_month: number;
  loa_revenue_month: number;
  avg_ticket: number;
  monthly_goal: number;
  monthly_realized: number;
  churn_month: number;
  delinquency_rate: number;
  nps_weekly: number;
  wayzen_activities_today: number;
  wow_conversion_var: number;
  baseline_conversion_rate: number;
  baseline_monthly_revenue: number;
  baseline_avg_ticket: number;
  current_conversion_rate: number;
  current_monthly_revenue: number;
  current_avg_ticket: number;
  created_at: string;
  updated_at: string;
}

export interface MarketingDataEntry {
  id: number;
  client_id: number;
  period_date: string;
  channel: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  meetings_booked: number;
  proposals_sent: number;
  deals_won: number;
  revenue: number;
  notes?: string | null;
  created_at: string;
}
