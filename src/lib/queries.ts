import { supabase } from './supabase';

// ─── Helper Functions ────────────────────────────────────────────────
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const uid = user.id;
  let baseQuery = supabase
    .from('users')
    .select('id, email, name, role, client_id, phone, avatar_url, created_at')
    .eq('auth_user_id', uid)
    .maybeSingle();

  let { data: userData, error } = await baseQuery;

  if (!userData && user.email) {
    const fallback = await supabase
      .from('users')
      .select('id, email, name, role, client_id, phone, avatar_url, created_at')
      .eq('email', user.email)
      .single();
    userData = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return userData;
}

// ─── Clients ─────────────────────────────────────────────────────────
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getClientById(id: number) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createClient(clientData: {
  companyName: string;
  tradeName?: string;
  cnpj?: string;
  segment?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status?: string;
  monthlyFee?: number;
  contractStart?: string;
  contractEnd?: string;
}) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      company_name: clientData.companyName,
      trade_name: clientData.tradeName,
      cnpj: clientData.cnpj,
      segment: clientData.segment,
      contact_name: clientData.contactName,
      contact_email: clientData.contactEmail,
      contact_phone: clientData.contactPhone,
      status: clientData.status || 'active',
      monthly_fee: clientData.monthlyFee || 0,
      contract_start: clientData.contractStart,
      contract_end: clientData.contractEnd,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Project Updates ─────────────────────────────────────────────────
export async function getProjectUpdates(clientId: number) {
  const { data, error } = await supabase
    .from('project_updates')
    .select(`
      *,
      author:users!project_updates_created_by_user_id_fkey(name)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map((update: any) => ({
    ...update,
    author_name: update.author?.name,
  }));
}

export async function createProjectUpdate(updateData: {
  clientId: number;
  title: string;
  content: string;
  type?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('project_updates')
    .insert({
      client_id: updateData.clientId,
      title: updateData.title,
      content: updateData.content,
      type: updateData.type || 'update',
      created_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Sprints ─────────────────────────────────────────────────────────
export async function getSprints(clientId: number) {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('client_id', clientId)
    .order('week_number', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getSprintTasks(sprintId: number) {
  const { data, error } = await supabase
    .from('sprint_tasks')
    .select('*')
    .eq('sprint_id', sprintId)
    .order('task_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createSprint(sprintData: {
  clientId: number;
  name: string;
  weekNumber: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('sprints')
    .insert({
      client_id: sprintData.clientId,
      name: sprintData.name,
      week_number: sprintData.weekNumber,
      status: 'planned',
      start_date: sprintData.startDate,
      end_date: sprintData.endDate,
      notes: sprintData.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSprint(sprintId: number, updates: {
  status?: 'planned' | 'in_progress' | 'completed';
  startDate?: string;
  endDate?: string;
  notes?: string;
}) {
  const payload: Record<string, unknown> = {};
  if (updates.status) payload.status = updates.status;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.endDate !== undefined) payload.end_date = updates.endDate;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { error } = await supabase
    .from('sprints')
    .update(payload)
    .eq('id', sprintId);

  if (error) throw error;
}

export async function createSprintTask(taskData: {
  sprintId: number;
  title: string;
  description?: string;
  taskOrder?: number;
}) {
  const { data, error } = await supabase
    .from('sprint_tasks')
    .insert({
      sprint_id: taskData.sprintId,
      title: taskData.title,
      description: taskData.description,
      week_number: 0,
      task_order: taskData.taskOrder || 0,
      is_completed: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSprintTask(taskId: number, updates: { isCompleted?: boolean }) {
  const payload: Record<string, unknown> = {};
  if (updates.isCompleted !== undefined) {
    payload.is_completed = updates.isCompleted;
    payload.completed_at = updates.isCompleted ? new Date().toISOString() : null;
  }

  const { error } = await supabase
    .from('sprint_tasks')
    .update(payload)
    .eq('id', taskId);

  if (error) throw error;
}

export async function getSprintBacklog(clientId: number) {
  const { data, error } = await supabase
    .from('sprint_backlog')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createSprintBacklogItem(itemData: {
  clientId: number;
  sprintId?: number | null;
  title: string;
  details?: string;
  occurredOn?: string;
  dueDate?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('sprint_backlog')
    .insert({
      client_id: itemData.clientId,
      sprint_id: itemData.sprintId ?? null,
      title: itemData.title,
      details: itemData.details,
      occurred_on: itemData.occurredOn,
      due_date: itemData.dueDate,
      status: 'planned',
      created_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Tickets ─────────────────────────────────────────────────────────
export async function getTickets(clientId?: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  let query = supabase
    .from('tickets')
    .select(`
      *,
      creator:users!tickets_user_id_fkey(name),
      client:clients(company_name)
    `)
    .order('created_at', { ascending: false });

  // Se for cliente, filtrar por client_id
  if (user.role === 'client' && user.client_id) {
    query = query.eq('client_id', user.client_id);
  } else if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((ticket: any) => ({
    ...ticket,
    creator_name: ticket.creator?.name,
    company_name: ticket.client?.company_name,
  }));
}

export async function getTicketById(id: number) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      creator:users!tickets_user_id_fkey(name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    ...data,
    creator_name: data.creator?.name,
  };
}

export async function createTicket(ticketData: {
  title: string;
  description: string;
  priority?: string;
  category?: string;
  clientId?: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const clientId = ticketData.clientId || user.client_id;
  if (!clientId) throw new Error('Cliente não identificado');

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      client_id: clientId,
      user_id: user.id,
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority || 'medium',
      category: ticketData.category,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTicket(id: number, updates: {
  status?: string;
  assignedUserId?: number | null;
}) {
  const updateData: any = {};
  
  if (updates.status) {
    updateData.status = updates.status;
    if (updates.status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }
  }
  
  if (updates.assignedUserId !== undefined) {
    updateData.assigned_user_id = updates.assignedUserId;
  }

  const { error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

// ─── Ticket Messages ─────────────────────────────────────────────────
export async function getTicketMessages(ticketId: number) {
  const { data, error } = await supabase
    .from('ticket_messages')
    .select(`
      *,
      author:users(name, role)
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data.map((message: any) => ({
    ...message,
    author_name: message.author?.name,
    author_role: message.author?.role,
  }));
}

export async function createTicketMessage(messageData: {
  ticketId: number;
  message: string;
  isInternal?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: messageData.ticketId,
      user_id: user.id,
      message: messageData.message,
      is_internal: (messageData.isInternal && user.role !== 'client') ? true : false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Documents ───────────────────────────────────────────────────────
export async function getDocuments(clientId: number) {
  const { data, error } = await supabase
    .from('shared_documents')
    .select(`
      *,
      uploader:users!shared_documents_uploaded_by_user_id_fkey(name)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((doc: any) => ({
    ...doc,
    uploader_name: doc.uploader?.name,
  }));
}

export async function createDocument(docData: {
  clientId: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('shared_documents')
    .insert({
      client_id: docData.clientId,
      title: docData.title,
      description: docData.description,
      file_url: docData.fileUrl,
      file_name: docData.fileName,
      file_size: docData.fileSize,
      mime_type: docData.mimeType,
      category: docData.category,
      uploaded_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(id: number) {
  const { error } = await supabase
    .from('shared_documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Reports ─────────────────────────────────────────────────────────
export async function getReports(clientId: number) {
  const { data, error } = await supabase
    .from('shared_reports')
    .select(`
      *,
      author:users!shared_reports_created_by_user_id_fkey(name)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((report: any) => ({
    ...report,
    author_name: report.author?.name,
  }));
}

export async function createReport(reportData: {
  clientId: number;
  title: string;
  type?: string;
  periodStart: string;
  periodEnd: string;
  content: string;
  metrics?: any;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('shared_reports')
    .insert({
      client_id: reportData.clientId,
      title: reportData.title,
      type: reportData.type || 'weekly',
      period_start: reportData.periodStart,
      period_end: reportData.periodEnd,
      content: reportData.content,
      metrics: reportData.metrics,
      created_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDailyLogs(clientId: number) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('log_date', { ascending: false })
    .limit(30);

  if (error) throw error;
  return data;
}

export async function createDailyLog(payload: {
  clientId: number;
  logDate: string;
  progressScore: number;
  hoursWorked: number;
  summary: string;
  blockers?: string;
  nextSteps?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('daily_logs')
    .insert({
      client_id: payload.clientId,
      consultant_user_id: user.id,
      log_date: payload.logDate,
      progress_score: payload.progressScore,
      hours_worked: payload.hoursWorked,
      summary: payload.summary,
      blockers: payload.blockers,
      next_steps: payload.nextSteps,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMeetingEvents(clientId: number) {
  const { data, error } = await supabase
    .from('meeting_events')
    .select('*')
    .eq('client_id', clientId)
    .order('meeting_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createMeetingEvent(payload: {
  clientId: number;
  title: string;
  meetingDate: string;
  meetingType: 'meeting' | 'call';
  transcript?: string;
  notes?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('meeting_events')
    .insert({
      client_id: payload.clientId,
      title: payload.title,
      meeting_date: payload.meetingDate,
      meeting_type: payload.meetingType,
      transcript: payload.transcript,
      notes: payload.notes,
      created_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Notifications ───────────────────────────────────────────────────
export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

export async function getUnreadNotificationsCount() {
  const user = await getCurrentUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

export async function markNotificationAsRead(id: number) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────
export async function getDashboardData(clientId: number) {
  // Buscar dados em paralelo
  const [
    client,
    openTicketsCount,
    docsCount,
    reportsCount,
    recentUpdates,
    activeSprints,
    allTasks
  ] = await Promise.all([
    getClientById(clientId),
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .in('status', ['open', 'in_progress'])
      .then(r => r.count || 0),
    supabase
      .from('shared_documents')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .then(r => r.count || 0),
    supabase
      .from('shared_reports')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .then(r => r.count || 0),
    getProjectUpdates(clientId).then(updates => updates.slice(0, 5)),
    supabase
      .from('sprints')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'in_progress')
      .then(r => r.data || []),
    supabase
      .from('sprint_tasks')
      .select('is_completed, sprints!inner(client_id)')
      .eq('sprints.client_id', clientId)
      .then(r => r.data || [])
  ]);

  const completed = allTasks.filter((t: any) => t.is_completed).length;
  const total = allTasks.length;

  return {
    client,
    openTickets: openTicketsCount,
    totalDocuments: docsCount,
    totalReports: reportsCount,
    recentUpdates,
    activeSprints,
    sprintProgress: { completed, total },
  };
}
