import * as queries from '@/lib/queries';
import {
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
  clientId?: number;
}

interface DocumentForm {
  clientId: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  category?: string;
  fileSize: number;
  mimeType: string;
}

export const portalService = {
  getDashboard: (clientId: number) => queries.getDashboardData(clientId),

  getSprints: (clientId: number) => queries.getSprints(clientId),
  getSprintTasks: (sprintId: number) => queries.getSprintTasks(sprintId),

  getTickets: () => queries.getTickets(),
  getTicketMessages: (ticketId: number) => queries.getTicketMessages(ticketId),
  createTicket: (payload: TicketForm) => queries.createTicket(payload),
  updateTicketStatus: (ticketId: number, status: TicketStatus) => 
    queries.updateTicket(ticketId, { status }),
  addTicketMessage: (ticketId: number, message: string) => 
    queries.createTicketMessage({ ticketId, message }),

  getDocuments: (clientId: number) => queries.getDocuments(clientId),
  createDocument: (payload: DocumentForm) => queries.createDocument(payload),
  deleteDocument: (documentId: number) => queries.deleteDocument(documentId),

  getReports: (clientId: number) => queries.getReports(clientId),

  getNotifications: () => queries.getNotifications(),
  markNotificationRead: (notificationId: number) => queries.markNotificationAsRead(notificationId),
  markAllNotificationsRead: () => queries.markAllNotificationsAsRead(),
};
