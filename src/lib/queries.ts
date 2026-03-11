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

// ─── Calendar sync helpers (fire-and-forget) ────────────────────────────────
async function upsertSprintCalendarEvent(
  clientId: number,
  sprintId: number,
  name: string,
  endDate: string,
): Promise<void> {
  await supabase
    .from('project_calendar_events')
    .upsert(
      {
        id: 900000 + sprintId,
        client_id: clientId,
        title: `Entrega: ${name}`,
        start_at: `${endDate}T09:00:00Z`,
        end_at: `${endDate}T09:00:00Z`,
        type: 'sprint_delivery',
        description: `Entrega da sprint "${name}"`,
        participant_ids: [],
      },
      { onConflict: 'id' },
    );
}

async function upsertBacklogCalendarEvent(
  clientId: number,
  itemId: number,
  title: string,
  dueDate: string,
): Promise<void> {
  await supabase
    .from('project_calendar_events')
    .upsert(
      {
        id: 800000 + itemId,
        client_id: clientId,
        title: `Prazo: ${title}`,
        start_at: `${dueDate}T09:00:00Z`,
        end_at: `${dueDate}T09:00:00Z`,
        type: 'general',
        description: `Atividade: ${title}`,
        participant_ids: [],
      },
      { onConflict: 'id' },
    );
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
  if (sprintData.endDate && data) {
    upsertSprintCalendarEvent(sprintData.clientId, data.id, sprintData.name, sprintData.endDate).catch(console.error);
  }
  return data;
}

export async function updateSprint(sprintId: number, updates: {
  status?: 'planned' | 'in_progress' | 'completed';
  startDate?: string;
  endDate?: string;
  notes?: string;
  name?: string;
  clientId?: number;
}) {
  const payload: Record<string, unknown> = {};
  if (updates.status) payload.status = updates.status;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.endDate !== undefined) payload.end_date = updates.endDate;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.name !== undefined) payload.name = updates.name;

  const { error } = await supabase
    .from('sprints')
    .update(payload)
    .eq('id', sprintId);

  if (error) throw error;
  if (updates.endDate && updates.clientId && updates.name) {
    upsertSprintCalendarEvent(updates.clientId, sprintId, updates.name, updates.endDate).catch(console.error);
  }
}

export async function createSprintTask(taskData: {
  sprintId: number;
  backlogItemId?: number | null;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  taskOrder?: number;
}) {
  const { data, error } = await supabase
    .from('sprint_tasks')
    .insert({
      sprint_id: taskData.sprintId,
      backlog_item_id: taskData.backlogItemId ?? null,
      title: taskData.title,
      description: taskData.description,
      start_date: taskData.startDate,
      end_date: taskData.endDate,
      week_number: 0,
      task_order: taskData.taskOrder || 0,
      is_completed: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSprintTask(taskId: number, updates: { isCompleted?: boolean; title?: string; description?: string }) {
  const payload: Record<string, unknown> = {};
  if (updates.isCompleted !== undefined) {
    payload.is_completed = updates.isCompleted;
    payload.completed_at = updates.isCompleted ? new Date().toISOString() : null;
  }
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;

  const { error } = await supabase
    .from('sprint_tasks')
    .update(payload)
    .eq('id', taskId);

  if (error) throw error;
}

export async function getBacklogActivities(clientId: number) {
  const { data, error } = await supabase
    .from('sprint_tasks')
    .select('*, sprints!inner(client_id, name)')
    .eq('sprints.client_id', clientId)
    .not('backlog_item_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    sprint_name: item.sprints?.name,
  }));
}

export async function getSprintBacklog(clientId: number) {
  const { data, error } = await supabase
    .from('sprint_backlog')
    .select(`
      *,
      author:users!sprint_backlog_created_by_user_id_fkey(name)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    created_by_name: item.author?.name || null,
  }));
}

export async function updateSprintBacklogItem(backlogId: number, updates: {
  status?: 'planned' | 'in_progress' | 'done';
  sprintId?: number | null;
  clientId?: number;
  title?: string;
  dueDate?: string;
}) {
  const payload: Record<string, unknown> = {};
  if (updates.status) payload.status = updates.status;
  if (updates.sprintId !== undefined) payload.sprint_id = updates.sprintId;

  const { error } = await supabase
    .from('sprint_backlog')
    .update(payload)
    .eq('id', backlogId);

  if (error) throw error;
  if (updates.dueDate && updates.clientId && updates.title) {
    upsertBacklogCalendarEvent(updates.clientId, backlogId, updates.title, updates.dueDate).catch(console.error);
  }
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
  if (itemData.dueDate && data) {
    upsertBacklogCalendarEvent(itemData.clientId, data.id, itemData.title, itemData.dueDate).catch(console.error);
  }
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

// ─── Internal + Client Chat ────────────────────────────────────────
export async function getChatRooms(clientId: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const rooms = (data || []).filter((room: any) => {
    if (room.room_type === 'internal' && user.role === 'client') return false;
    if (room.room_type !== 'direct') return true;
    return room.direct_user_a_id === user.id || room.direct_user_b_id === user.id || user.role !== 'client';
  });

  const directOtherIds = Array.from(new Set(
    rooms
      .filter((room: any) => room.room_type === 'direct')
      .map((room: any) => (room.direct_user_a_id === user.id ? room.direct_user_b_id : room.direct_user_a_id))
      .filter(Boolean)
  ));

  let peopleById: Record<number, { name: string; role: string }> = {};
  if (directOtherIds.length) {
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, role')
      .in('id', directOtherIds);

    if (usersError) throw usersError;

    peopleById = (usersData || []).reduce((acc: Record<number, { name: string; role: string }>, person: any) => {
      acc[person.id] = { name: person.name, role: person.role };
      return acc;
    }, {});
  }

  const rankByType: Record<string, number> = { general: 0, direct: 1, internal: 2 };
  return rooms
    .map((room: any) => {
      if (room.room_type !== 'direct') return room;
      const otherId = room.direct_user_a_id === user.id ? room.direct_user_b_id : room.direct_user_a_id;
      const person = peopleById[otherId];
      return {
        ...room,
        contact_user_id: otherId,
        contact_name: person?.name || null,
        contact_role: person?.role || null,
      };
    })
    .sort((a: any, b: any) => (rankByType[a.room_type] || 99) - (rankByType[b.room_type] || 99));
}

export async function getChatContacts(clientId: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const query = supabase
    .from('users')
    .select('id, name, role')
    .eq('is_active', true)
    .neq('id', user.id)
    .order('name', { ascending: true });

  if (user.role === 'client') {
    const { data, error } = await query.in('role', ['admin', 'consultant']);
    if (error) throw error;
    return data || [];
  }

  const { data, error } = await query.eq('role', 'client').eq('client_id', clientId);
  if (error) throw error;
  return data || [];
}

export async function getOrCreateDirectChatRoom(clientId: number, contactUserId: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  if (user.id === contactUserId) {
    throw new Error('Nao e permitido abrir chat direto com o proprio usuario.');
  }

  const userA = Math.min(user.id, contactUserId);
  const userB = Math.max(user.id, contactUserId);

  const existing = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('client_id', clientId)
    .eq('room_type', 'direct')
    .eq('direct_user_a_id', userA)
    .eq('direct_user_b_id', userB)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const { data, error } = await supabase
    .from('chat_rooms')
    .insert({
      client_id: clientId,
      room_type: 'direct',
      name: 'Chat Direto',
      direct_user_a_id: userA,
      direct_user_b_id: userB,
      created_by_user_id: user.id,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getChatMessages(roomId: number) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      author:users(name, role)
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((message: any) => ({
    ...message,
    author_name: message.author?.name,
    author_role: message.author?.role,
  }));
}

export async function createChatMessage(roomId: number, message: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      user_id: user.id,
      message,
    })
    .select('*')
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

export async function getProjectContacts(clientId: number) {
  const { data, error } = await supabase
    .from('project_contacts')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProjectContact(payload: {
  clientId: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
}) {
  const { data, error } = await supabase
    .from('project_contacts')
    .insert({
      client_id: payload.clientId,
      name: payload.name,
      role: payload.role,
      email: payload.email,
      phone: payload.phone,
      notes: payload.notes,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateProjectContact(contactId: number, payload: {
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
}) {
  const { data, error } = await supabase
    .from('project_contacts')
    .update({
      name: payload.name,
      role: payload.role,
      email: payload.email,
      phone: payload.phone,
      notes: payload.notes,
    })
    .eq('id', contactId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProjectContact(contactId: number) {
  const { error } = await supabase
    .from('project_contacts')
    .delete()
    .eq('id', contactId);

  if (error) throw error;
}

export async function getProjectCalendarEvents(clientId: number) {
  const { data, error } = await supabase
    .from('project_calendar_events')
    .select('*')
    .eq('client_id', clientId)
    .order('start_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function syncProjectCalendarEvents(clientId: number, events: Array<{
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  type: string;
  description?: string | null;
  participant_ids?: number[];
}>) {
  const { data: existingRows, error: existingError } = await supabase
    .from('project_calendar_events')
    .select('id')
    .eq('client_id', clientId);

  if (existingError) throw existingError;

  const existingIds = new Set((existingRows || []).map((row: any) => Number(row.id)));
  const incomingIds = new Set(events.map((event) => Number(event.id)));

  const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));
  if (toDelete.length) {
    const { error } = await supabase
      .from('project_calendar_events')
      .delete()
      .eq('client_id', clientId)
      .in('id', toDelete);
    if (error) throw error;
  }

  if (!events.length) return;

  const payload = events.map((event) => ({
    id: event.id,
    client_id: clientId,
    title: event.title,
    start_at: event.start_at,
    end_at: event.end_at,
    type: event.type,
    description: event.description || null,
    participant_ids: event.participant_ids || [],
  }));

  const { error: upsertError } = await supabase
    .from('project_calendar_events')
    .upsert(payload, { onConflict: 'id' });

  if (upsertError) throw upsertError;
}

export async function getAnalyticsData(clientId: number) {
  const [reports, dailyLogs, meetings, tickets] = await Promise.all([
    supabase
      .from('shared_reports')
      .select('period_end, metrics')
      .eq('client_id', clientId)
      .order('period_end', { ascending: true }),
    supabase
      .from('daily_logs')
      .select('log_date, progress_score, hours_worked')
      .eq('client_id', clientId)
      .order('log_date', { ascending: true }),
    supabase
      .from('meeting_events')
      .select('meeting_date, meeting_type')
      .eq('client_id', clientId)
      .order('meeting_date', { ascending: true }),
    supabase
      .from('tickets')
      .select('created_at, status')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true }),
  ]);

  if (reports.error) throw reports.error;
  if (dailyLogs.error) throw dailyLogs.error;
  if (meetings.error) throw meetings.error;
  if (tickets.error) throw tickets.error;

  const monthly: Record<string, any> = {};
  const ensureMonth = (key: string) => {
    if (!monthly[key]) {
      monthly[key] = {
        period: key,
        leads: 0,
        costPerLead: 0,
        activeCampaigns: 0,
        conversionRate: 0,
        meetings: 0,
        proposals: 0,
        dealsClosed: 0,
        averageTicket: 0,
      };
    }
    return monthly[key];
  };

  (reports.data || []).forEach((row: any) => {
    const date = row.period_end ? new Date(row.period_end) : null;
    const key = date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString('pt-BR', { month: 'short' })
      : 'N/A';
    const bucket = ensureMonth(key);
    const metrics = (row.metrics || {}) as Record<string, number>;
    bucket.leads += Number(metrics.leads || 0);
    bucket.costPerLead += Number(metrics.costPerLead || metrics.cpl || 0);
    bucket.activeCampaigns += Number(metrics.activeCampaigns || metrics.campaigns || 0);
    bucket.conversionRate += Number(metrics.conversionRate || 0);
    bucket.proposals += Number(metrics.proposals || 0);
    bucket.dealsClosed += Number(metrics.dealsClosed || metrics.deals || 0);
    bucket.averageTicket += Number(metrics.averageTicket || 0);
  });

  (meetings.data || []).forEach((row: any) => {
    const date = row.meeting_date ? new Date(row.meeting_date) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    const key = date.toLocaleDateString('pt-BR', { month: 'short' });
    const bucket = ensureMonth(key);
    bucket.meetings += 1;
  });

  (tickets.data || []).forEach((row: any) => {
    const date = row.created_at ? new Date(row.created_at) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    const key = date.toLocaleDateString('pt-BR', { month: 'short' });
    const bucket = ensureMonth(key);
    if (row.status === 'resolved' || row.status === 'closed') {
      bucket.dealsClosed += 1;
    }
    bucket.leads += 1;
  });

  const marketing = Object.values(monthly).map((item: any) => ({
    period: item.period,
    leads: item.leads,
    costPerLead: item.costPerLead,
    activeCampaigns: item.activeCampaigns,
    conversionRate: Number(item.conversionRate.toFixed(2)),
  }));

  const sales = Object.values(monthly).map((item: any) => ({
    period: item.period,
    meetings: item.meetings,
    proposals: item.proposals,
    dealsClosed: item.dealsClosed,
    averageTicket: item.averageTicket,
  }));

  const correlation = Object.values(monthly).map((item: any) => ({
    label: item.period,
    leads: item.leads,
    deals: item.dealsClosed,
  }));

  const funnel = (() => {
    const totalLeads = marketing.reduce((acc, row) => acc + row.leads, 0);
    const totalMeetings = sales.reduce((acc, row) => acc + row.meetings, 0);
    const totalProposals = sales.reduce((acc, row) => acc + row.proposals, 0);
    const totalDeals = sales.reduce((acc, row) => acc + row.dealsClosed, 0);
    const avgProgress = (dailyLogs.data || []).length
      ? (dailyLogs.data || []).reduce((acc: number, row: any) => acc + Number(row.progress_score || 0), 0) / (dailyLogs.data || []).length
      : 0;

    return [
      { stage: 'Leads', value: Math.round(totalLeads) },
      { stage: 'Reunioes', value: Math.round(totalMeetings) },
      { stage: 'Propostas', value: Math.round(totalProposals) },
      { stage: 'Negocios', value: Math.round(totalDeals) },
      { stage: 'Saude do Projeto', value: Math.round(avgProgress) },
    ];
  })();

  return {
    marketing,
    sales,
    correlation,
    funnel,
  };
}

export async function getDashboardSalesSeries(clientId: number) {
  const [sprints, tickets, meetings] = await Promise.all([
    supabase
      .from('sprints')
      .select('start_date, end_date')
      .eq('client_id', clientId)
      .order('start_date', { ascending: true }),
    supabase
      .from('tickets')
      .select('created_at, status')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true }),
    supabase
      .from('meeting_events')
      .select('meeting_date')
      .eq('client_id', clientId)
      .order('meeting_date', { ascending: true }),
  ]);

  if (sprints.error) throw sprints.error;
  if (tickets.error) throw tickets.error;
  if (meetings.error) throw meetings.error;

  const monthMap: Record<string, number> = {};
  (tickets.data || []).forEach((ticket: any) => {
    const d = new Date(ticket.created_at);
    if (Number.isNaN(d.getTime())) return;
    const label = d.toLocaleDateString('pt-BR', { month: 'short' });
    monthMap[label] = (monthMap[label] || 0) + 1;
  });
  (sprints.data || []).forEach((sprint: any) => {
    const ref = sprint.end_date || sprint.start_date;
    if (!ref) return;
    const d = new Date(ref);
    if (Number.isNaN(d.getTime())) return;
    const label = d.toLocaleDateString('pt-BR', { month: 'short' });
    monthMap[label] = (monthMap[label] || 0) + 1;
  });

  const monthSales = Object.entries(monthMap).map(([name, value]) => ({ name, value }));

  const hourMap: Record<string, number> = {};
  (meetings.data || []).forEach((meeting: any) => {
    const d = new Date(meeting.meeting_date);
    if (Number.isNaN(d.getTime())) return;
    const hour = `${String(d.getHours()).padStart(2, '0')}h`;
    hourMap[hour] = (hourMap[hour] || 0) + 1;
  });

  const daySales = Object.entries(hourMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }));

  return {
    monthSales,
    daySales,
  };
}
