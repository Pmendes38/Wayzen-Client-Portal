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
}

export interface SprintTask {
  id: number;
  sprint_id: number;
  title: string;
  is_completed: 0 | 1;
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
  type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  content?: string | null;
  metrics?: string | null;
  author_name?: string;
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
