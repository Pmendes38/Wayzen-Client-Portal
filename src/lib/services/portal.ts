import { api } from '@/lib/api';
import {
  DashboardData,
  NotificationItem,
  SharedDocument,
  SharedReport,
  Sprint,
  SprintTask,
  SuccessResponse,
  TicketItem,
  TicketMessage,
  TicketPriority,
  TicketStatus,
} from '@/types/domain';

interface TicketForm {
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
  clientId: number;
}

interface DocumentForm {
  clientId: number;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  category: string;
}

export const portalService = {
  getDashboard: (clientId: number) => api.get<DashboardData>(`/portal/dashboard/${clientId}`),

  getSprints: (clientId: number) => api.get<Sprint[]>(`/sprints/${clientId}`),
  getSprintTasks: (sprintId: number) => api.get<SprintTask[]>(`/sprint-tasks/${sprintId}`),

  getTickets: () => api.get<TicketItem[]>('/tickets'),
  getTicketMessages: (ticketId: number) => api.get<TicketMessage[]>(`/ticket-messages/${ticketId}`),
  createTicket: (payload: TicketForm) => api.post<{ id: number }>('/tickets', payload),
  updateTicketStatus: (ticketId: number, status: TicketStatus) => api.patch<SuccessResponse>(`/tickets/${ticketId}`, { status }),
  addTicketMessage: (ticketId: number, message: string) => api.post<{ id: number }>('/ticket-messages', { ticketId, message }),

  getDocuments: (clientId: number) => api.get<SharedDocument[]>(`/documents/${clientId}`),
  createDocument: (payload: DocumentForm) => api.post<{ id: number }>('/documents', payload),
  deleteDocument: (documentId: number) => api.delete<SuccessResponse>(`/documents/${documentId}`),

  getReports: (clientId: number) => api.get<SharedReport[]>(`/reports/${clientId}`),

  getNotifications: () => api.get<NotificationItem[]>('/notifications'),
  markNotificationRead: (notificationId: number) => api.patch<SuccessResponse>(`/notifications/${notificationId}/read`, {}),
  markAllNotificationsRead: () => api.patch<SuccessResponse>('/notifications/read-all', {}),
};
