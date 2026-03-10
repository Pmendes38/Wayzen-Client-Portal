import * as queries from '@/lib/queries';
import {
  DailyLog,
  MeetingEvent,
  SharedDocument,
  SharedReport,
  Sprint,
  SprintBacklogItem,
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
  createSprint: (payload: {
    clientId: number;
    name: string;
    weekNumber: number;
    startDate?: string;
    endDate?: string;
    notes?: string;
  }) => queries.createSprint(payload),
  updateSprint: (sprintId: number, payload: {
    status?: 'planned' | 'in_progress' | 'completed';
    startDate?: string;
    endDate?: string;
    notes?: string;
  }) => queries.updateSprint(sprintId, payload),
  createSprintTask: (payload: {
    sprintId: number;
    backlogItemId?: number | null;
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    taskOrder?: number;
  }) => queries.createSprintTask(payload),
  updateSprintTask: (taskId: number, payload: { isCompleted?: boolean }) => queries.updateSprintTask(taskId, payload),
  getSprintBacklog: (clientId: number) => queries.getSprintBacklog(clientId),
  updateSprintBacklogItem: (backlogId: number, payload: {
    status?: 'planned' | 'in_progress' | 'done';
    sprintId?: number | null;
  }) => queries.updateSprintBacklogItem(backlogId, payload),
  getBacklogActivities: (clientId: number) => queries.getBacklogActivities(clientId),
  createSprintBacklogItem: (payload: {
    clientId: number;
    sprintId?: number | null;
    title: string;
    details?: string;
    occurredOn?: string;
    dueDate?: string;
  }) => queries.createSprintBacklogItem(payload),

  getTickets: (clientId?: number) => queries.getTickets(clientId),
  getTicketMessages: (ticketId: number) => queries.getTicketMessages(ticketId),
  createTicket: (payload: TicketForm) => queries.createTicket(payload),
  updateTicketStatus: (ticketId: number, status: TicketStatus) => 
    queries.updateTicket(ticketId, { status }),
  addTicketMessage: (ticketId: number, message: string) => 
    queries.createTicketMessage({ ticketId, message }),

  getChatRooms: (clientId: number) => queries.getChatRooms(clientId),
  getChatContacts: (clientId: number) => queries.getChatContacts(clientId),
  getOrCreateDirectChatRoom: (clientId: number, contactUserId: number) =>
    queries.getOrCreateDirectChatRoom(clientId, contactUserId),
  getChatMessages: (roomId: number) => queries.getChatMessages(roomId),
  createChatMessage: (roomId: number, message: string) => queries.createChatMessage(roomId, message),

  getDocuments: (clientId: number) => queries.getDocuments(clientId),
  createDocument: (payload: DocumentForm) => queries.createDocument(payload),
  deleteDocument: (documentId: number) => queries.deleteDocument(documentId),

  getReports: (clientId: number) => queries.getReports(clientId),
  createReport: (payload: {
    clientId: number;
    title: string;
    type?: string;
    periodStart: string;
    periodEnd: string;
    content: string;
    metrics?: unknown;
  }) => queries.createReport(payload),

  getDailyLogs: (clientId: number) => queries.getDailyLogs(clientId),
  createDailyLog: (payload: {
    clientId: number;
    logDate: string;
    progressScore: number;
    hoursWorked: number;
    summary: string;
    blockers?: string;
    nextSteps?: string;
  }) => queries.createDailyLog(payload),

  getMeetingEvents: (clientId: number) => queries.getMeetingEvents(clientId),
  createMeetingEvent: (payload: {
    clientId: number;
    title: string;
    meetingDate: string;
    meetingType: 'meeting' | 'call';
    transcript?: string;
    notes?: string;
  }) => queries.createMeetingEvent(payload),

  getNotifications: () => queries.getNotifications(),
  markNotificationRead: (notificationId: number) => queries.markNotificationAsRead(notificationId),
  markAllNotificationsRead: () => queries.markAllNotificationsAsRead(),
};
