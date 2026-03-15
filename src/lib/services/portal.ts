import * as queries from '@/lib/queries';
import {
  ChatRoomParticipant,
  DailyLog,
  MeetingEvent,
  NotificationItem,
  SharedDocument,
  SharedReport,
  Sprint,
  SprintAttachment,
  SprintBacklogItem,
  SprintSubtask,
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

type SubtaskInput = Partial<SprintSubtask> & {
  id?: string;
  title?: string;
  done?: boolean;
};

type AttachmentInput = Partial<SprintAttachment> & {
  id?: string;
  name?: string;
  url?: string;
  type?: string | null;
  mimeType?: string | null;
  uploaded_at?: string;
};

function normalizeSubtasks(subtasks?: SubtaskInput[]): SprintSubtask[] | undefined {
  if (subtasks === undefined) return undefined;
  if (!Array.isArray(subtasks)) {
    throw new Error('Subtarefas precisam ser enviadas em uma lista.');
  }

  return subtasks.map((subtask, index) => {
    const id = String(subtask.id || '').trim();
    const title = String(subtask.title || '').trim();

    if (!id) throw new Error(`Subtarefa ${index + 1} sem id.`);
    if (!title) throw new Error(`Subtarefa ${index + 1} sem titulo.`);

    return {
      id,
      title,
      done: Boolean(subtask.done),
      created_at: typeof subtask.created_at === 'string' && subtask.created_at
        ? subtask.created_at
        : new Date().toISOString(),
    };
  });
}

function normalizeAttachments(attachments?: AttachmentInput[]): SprintAttachment[] | undefined {
  if (attachments === undefined) return undefined;
  if (!Array.isArray(attachments)) {
    throw new Error('Anexos precisam ser enviados em uma lista.');
  }

  return attachments.map((attachment, index) => {
    const id = String(attachment.id || '').trim();
    const name = String(attachment.name || '').trim();
    const url = String(attachment.url || '').trim();

    if (!id) throw new Error(`Anexo ${index + 1} sem id.`);
    if (!name) throw new Error(`Anexo ${index + 1} sem nome.`);
    if (!url) throw new Error(`Anexo ${index + 1} sem url.`);

    return {
      id,
      name,
      url,
      type: attachment.type ?? attachment.mimeType ?? null,
      uploaded_at: typeof attachment.uploaded_at === 'string' && attachment.uploaded_at
        ? attachment.uploaded_at
        : new Date().toISOString(),
    };
  });
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
  deleteSprint: (sprintId: number) => queries.deleteSprint(sprintId),
  updateSprint: (sprintId: number, payload: {
    status?: 'planned' | 'in_progress' | 'completed';
    startDate?: string;
    endDate?: string;
    notes?: string;
    name?: string;
    clientId?: number;
  }) => queries.updateSprint(sprintId, payload),
  createSprintTask: (payload: {
    sprintId: number;
    backlogItemId?: number | null;
    title: string;
    description?: string;
    contextNotes?: string;
    subtasks?: SubtaskInput[];
    attachments?: AttachmentInput[];
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    taskOrder?: number;
  }) => queries.createSprintTask({
    ...payload,
    subtasks: normalizeSubtasks(payload.subtasks),
    attachments: normalizeAttachments(payload.attachments),
  }),
  updateSprintTask: (taskId: number, payload: {
    isCompleted?: boolean;
    title?: string;
    description?: string;
    contextNotes?: string;
    subtasks?: SubtaskInput[];
    attachments?: AttachmentInput[];
    dueDate?: string;
    endDate?: string;
    clientId?: number;
  }) => queries.updateSprintTask(taskId, {
    ...payload,
    subtasks: normalizeSubtasks(payload.subtasks),
    attachments: normalizeAttachments(payload.attachments),
  }),
  deleteSprintTask: (taskId: number) => queries.deleteSprintTask(taskId),
  getSprintBacklog: (clientId: number) => queries.getSprintBacklog(clientId),
  updateSprintBacklogItem: (backlogId: number, payload: {
    status?: 'planned' | 'in_progress' | 'done';
    sprintId?: number | null;
    clientId?: number;
    title?: string;
    details?: string;
    contextNotes?: string;
    subtasks?: SubtaskInput[];
    attachments?: AttachmentInput[];
    dueDate?: string;
  }) => queries.updateSprintBacklogItem(backlogId, {
    ...payload,
    subtasks: normalizeSubtasks(payload.subtasks),
    attachments: normalizeAttachments(payload.attachments),
  }),
  getBacklogActivities: (clientId: number) => queries.getBacklogActivities(clientId),
  createSprintBacklogItem: (payload: {
    clientId: number;
    sprintId?: number | null;
    title: string;
    details?: string;
    contextNotes?: string;
    subtasks?: SubtaskInput[];
    attachments?: AttachmentInput[];
    occurredOn?: string;
    dueDate?: string;
  }) => queries.createSprintBacklogItem({
    ...payload,
    subtasks: normalizeSubtasks(payload.subtasks),
    attachments: normalizeAttachments(payload.attachments),
  }),
  archiveCompletedBacklogItems: (clientId: number) => queries.archiveCompletedBacklogItems(clientId),

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
  createChatGroupRoom: (clientId: number, payload: { name: string; participantIds: number[] }) =>
    queries.createChatGroupRoom(clientId, payload),
  getChatRoomParticipants: (roomId: number): Promise<ChatRoomParticipant[]> =>
    queries.getChatRoomParticipants(roomId),
  addChatRoomParticipants: (roomId: number, participantIds: number[]) =>
    queries.addChatRoomParticipants(roomId, participantIds),
  removeChatRoomParticipant: (roomId: number, participantId: number) =>
    queries.removeChatRoomParticipant(roomId, participantId),
  getOrCreateProjectContactRoom: (clientId: number, contactName: string, projectContactId: number) =>
    queries.getOrCreateProjectContactRoom(clientId, contactName, projectContactId),
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

  getDailyLogs: () => queries.getDailyLogs(),
  createDailyLog: (payload: {
    logDate: string;
    progressScore: number;
    hoursWorked: number;
    summary: string;
    blockers?: string;
    nextSteps?: string;
  }) => queries.createDailyLog(payload),
  getDailyOperationalSnapshots: (clientId: number) => queries.getDailyOperationalSnapshots(clientId),
  upsertDailyOperationalSnapshot: (payload: {
    clientId: number;
    snapshotDate: string;
    slaFirstResponseMinutes: number;
    leadsWhatsapp: number;
    leadsInstagram: number;
    leadsSite: number;
    leadsReferral: number;
    leadsUnanswered: number;
    opportunitiesContatoInicial: number;
    opportunitiesQualificado: number;
    opportunitiesPropostaEnviada: number;
    opportunitiesNegociacao: number;
    opportunitiesFechado: number;
    followupsDone: number;
    followupsOverdue: number;
    conversionRateWeek: number;
    enrollmentsMonth: number;
    loaRevenueMonth: number;
    avgTicket: number;
    monthlyGoal: number;
    monthlyRealized: number;
    churnMonth: number;
    delinquencyRate: number;
    npsWeekly: number;
    wayzenActivitiesToday: number;
    wowConversionVar: number;
    baselineConversionRate: number;
    baselineMonthlyRevenue: number;
    baselineAvgTicket: number;
    currentConversionRate: number;
    currentMonthlyRevenue: number;
    currentAvgTicket: number;
  }) => queries.upsertDailyOperationalSnapshot(payload),

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
  createNotificationEvent: (payload: {
    userId: number;
    type: string;
    category: string;
    eventType: string;
    title: string;
    message?: string;
    linkTo?: string;
    sourceEntityType?: string;
    sourceEntityId?: number;
    occurredAt?: string;
    metadata?: Record<string, unknown>;
  }): Promise<NotificationItem> => queries.createNotificationEvent(payload),
  markNotificationRead: (notificationId: number) => queries.markNotificationAsRead(notificationId),
  markAllNotificationsRead: () => queries.markAllNotificationsAsRead(),

  getProjectContacts: (clientId: number) => queries.getProjectContacts(clientId),
  createProjectContact: (payload: {
    clientId: number;
    name: string;
    role: string;
    email: string;
    phone: string;
    notes: string;
  }) => queries.createProjectContact(payload),
  updateProjectContact: (contactId: number, payload: {
    name: string;
    role: string;
    email: string;
    phone: string;
    notes: string;
  }) => queries.updateProjectContact(contactId, payload),
  deleteProjectContact: (contactId: number) => queries.deleteProjectContact(contactId),

  getProjectCalendarEvents: (clientId: number) => queries.getProjectCalendarEvents(clientId),
  syncProjectCalendarEvents: (clientId: number, events: Array<{
    id: number;
    title: string;
    start_at: string;
    end_at: string;
    type: string;
    description?: string | null;
    participant_ids?: number[];
  }>) => queries.syncProjectCalendarEvents(clientId, events),

  getMarketingDataEntries: () => queries.getMarketingDataEntries(),
  createMarketingDataEntry: (payload: {
    periodDate: string;
    channel: string;
    campaignName: string;
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    meetingsBooked: number;
    proposalsSent: number;
    dealsWon: number;
    revenue: number;
    notes?: string;
  }) => queries.createMarketingDataEntry(payload),
  deleteMarketingDataEntry: (entryId: number) => queries.deleteMarketingDataEntry(entryId),

  getAnalyticsData: (clientId: number) => queries.getAnalyticsData(clientId),
  getDashboardSalesSeries: (clientId: number) => queries.getDashboardSalesSeries(clientId),
};
