import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from './supabase.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'wayzen-client-portal-secret-key-2025';

// Configuração CORS para produção
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
  process.env.BACKEND_URL
].filter((origin): origin is string => Boolean(origin));

app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? allowedOrigins 
    : true,
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// ─── Auth Middleware ─────────────────────────────────────────────────
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function authenticateToken(req: any, res: any, next: any) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Acesso negado' });
    next();
  };
}

function canAccessClient(req: any, clientId: number): boolean {
  return req.user.role !== 'client' || req.user.clientId === clientId;
}

// ─── Auth Routes ─────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, name, password, role, clientId } = req.body;
  if (!email || !name || !password) return res.status(400).json({ error: 'Campos obrigatórios: email, name, password' });
  
  try {
    // Verificar se email já existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existing) return res.status(409).json({ error: 'Email já cadastrado' });
    
    // Criar novo usuário
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash: hashPassword(password),
        role: role || 'client',
        client_id: clientId || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    const token = jwt.sign(
      { id: newUser.id, email, name, role: role || 'client', clientId: clientId || null },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: { id: newUser.id, email, name, role: role || 'client', clientId }, token });
  } catch (err: any) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (error || !user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, clientId: user.client_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ 
      user: { id: user.id, email: user.email, name: user.name, role: user.role, clientId: user.client_id }, 
      token 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, client_id, phone, avatar_url, created_at')
      .eq('id', req.user.id)
      .single();
    
    if (error || !user) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    res.json({ user: { ...user, clientId: user.client_id } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Clients Routes (admin/consultant) ──────────────────────────────
app.get('/api/clients', authenticateToken, requireRole('admin', 'consultant'), async (_req, res) => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(clients);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clients/:id', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role === 'client' && req.user.clientId !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !client) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(client);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', authenticateToken, requireRole('admin'), async (req, res) => {
  const { companyName, tradeName, cnpj, segment, contactName, contactEmail, contactPhone, status, monthlyFee, contractStart, contractEnd } = req.body;
  
  try {
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        company_name: companyName,
        trade_name: tradeName,
        cnpj,
        segment,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        status: status || 'active',
        monthly_fee: monthlyFee || 0,
        contract_start: contractStart,
        contract_end: contractEnd
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ id: newClient.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Project Updates Routes ─────────────────────────────────────────
app.get('/api/updates/:clientId', authenticateToken, async (req: any, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (req.user.role === 'client' && req.user.clientId !== clientId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { data: updates, error } = await supabase
      .from('project_updates')
      .select(`
        *,
        author:users!project_updates_created_by_user_id_fkey(name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedUpdates = updates.map((u: any) => ({
      ...u,
      author_name: u.author?.name
    }));
    
    res.json(formattedUpdates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/updates', authenticateToken, requireRole('admin', 'consultant'), async (req: any, res) => {
  const { clientId, title, content, type } = req.body;
  
  try {
    const { data: newUpdate, error } = await supabase
      .from('project_updates')
      .insert({
        client_id: clientId,
        title,
        content,
        type: type || 'update',
        created_by_user_id: req.user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ id: newUpdate.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Sprints Routes ─────────────────────────────────────────────────
app.get('/api/sprints/:clientId', authenticateToken, async (req: any, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (req.user.role === 'client' && req.user.clientId !== clientId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { data: sprints, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('client_id', clientId)
      .order('week_number', { ascending: true });
    
    if (error) throw error;
    res.json(sprints);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sprint-tasks/:sprintId', authenticateToken, async (req, res) => {
  try {
    const { data: sprint, error: sprintError } = await supabase
      .from('sprints')
      .select('id, client_id')
      .eq('id', req.params.sprintId)
      .single();
    
    if (sprintError || !sprint) return res.status(404).json({ error: 'Sprint não encontrada' });
    if (!canAccessClient(req as any, sprint.client_id)) return res.status(403).json({ error: 'Acesso negado' });
    
    const { data: tasks, error: tasksError } = await supabase
      .from('sprint_tasks')
      .select('*')
      .eq('sprint_id', req.params.sprintId)
      .order('task_order', { ascending: true });
    
    if (tasksError) throw tasksError;
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tickets Routes ─────────────────────────────────────────────────
app.get('/api/tickets', authenticateToken, async (req: any, res) => {
  try {
    let query = supabase
      .from('tickets')
      .select(`
        *,
        creator:users!tickets_user_id_fkey(name),
        client:clients(company_name)
      `)
      .order('created_at', { ascending: false });
    
    if (req.user.role === 'client') {
      query = query.eq('client_id', req.user.clientId);
    }
    
    const { data: tickets, error } = await query;
    if (error) throw error;
    
    const formattedTickets = tickets.map((t: any) => ({
      ...t,
      creator_name: t.creator?.name,
      company_name: t.client?.company_name
    }));
    
    res.json(formattedTickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:users!tickets_user_id_fkey(name)
      `)
      .eq('id', req.params.id)
      .single();
    
    if (error || !ticket) return res.status(404).json({ error: 'Ticket não encontrado' });
    if (!canAccessClient(req as any, ticket.client_id)) return res.status(403).json({ error: 'Acesso negado' });
    
    const formattedTicket = {
      ...ticket,
      creator_name: ticket.creator?.name
    };
    
    res.json(formattedTicket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', authenticateToken, async (req: any, res) => {
  const { title, description, priority, category } = req.body;
  const clientId = req.user.clientId;
  if (!clientId && req.user.role === 'client') {
    return res.status(400).json({ error: 'Usuário sem empresa vinculada' });
  }
  
  try {
    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert({
        client_id: req.body.clientId || clientId,
        user_id: req.user.id,
        title,
        description,
        priority: priority || 'medium',
        category
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ id: newTicket.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tickets/:id', authenticateToken, requireRole('admin', 'consultant'), async (req, res) => {
  const { status, assignedUserId } = req.body;
  
  try {
    const updates: any = {};
    if (status) {
      updates.status = status;
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
    }
    if (assignedUserId !== undefined) {
      updates.assigned_user_id = assignedUserId;
    }
    
    const { error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Ticket Messages Routes ─────────────────────────────────────────
app.get('/api/ticket-messages/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, client_id')
      .eq('id', req.params.ticketId)
      .single();
    
    if (ticketError || !ticket) return res.status(404).json({ error: 'Ticket não encontrado' });
    if (!canAccessClient(req as any, ticket.client_id)) return res.status(403).json({ error: 'Acesso negado' });
    
    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select(`
        *,
        author:users(name, role)
      `)
      .eq('ticket_id', req.params.ticketId)
      .order('created_at', { ascending: true });
    
    if (messagesError) throw messagesError;
    
    const formattedMessages = messages.map((m: any) => ({
      ...m,
      author_name: m.author?.name,
      author_role: m.author?.role
    }));
    
    res.json(formattedMessages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ticket-messages', authenticateToken, async (req: any, res) => {
  const { ticketId, message, isInternal } = req.body;
  
  try {
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, client_id')
      .eq('id', ticketId)
      .single();
    
    if (ticketError || !ticket) return res.status(404).json({ error: 'Ticket não encontrado' });
    if (!canAccessClient(req, ticket.client_id)) return res.status(403).json({ error: 'Acesso negado' });
    
    const { data: newMessage, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        user_id: req.user.id,
        message,
        is_internal: (isInternal && req.user.role !== 'client') ? true : false
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ id: newMessage.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Shared Documents Routes ────────────────────────────────────────
app.get('/api/documents/:clientId', authenticateToken, async (req: any, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (req.user.role === 'client' && req.user.clientId !== clientId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { data: docs, error } = await supabase
      .from('shared_documents')
      .select(`
        *,
        uploader:users!shared_documents_uploaded_by_user_id_fkey(name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedDocs = docs.map((d: any) => ({
      ...d,
      uploader_name: d.uploader?.name
    }));
    
    res.json(formattedDocs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents', authenticateToken, requireRole('admin', 'consultant'), async (req: any, res) => {
  const { clientId, title, description, fileUrl, fileName, fileSize, mimeType, category } = req.body;
  
  try {
    const { data: newDoc, error } = await supabase
      .from('shared_documents')
      .insert({
        client_id: clientId,
        title,
        description,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        category,
        uploaded_by_user_id: req.user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ id: newDoc.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('shared_documents')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Shared Reports Routes ──────────────────────────────────────────
app.get('/api/reports/:clientId', authenticateToken, async (req: any, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (req.user.role === 'client' && req.user.clientId !== clientId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { data: reports, error } = await supabase
      .from('shared_reports')
      .select(`
        *,
        author:users!shared_reports_created_by_user_id_fkey(name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedReports = reports.map((r: any) => ({
      ...r,
      author_name: r.author?.name
    }));
    
    res.json(formattedReports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', authenticateToken, requireRole('admin', 'consultant'), async (req: any, res) => {
  const { clientId, title, type, periodStart, periodEnd, content, metrics } = req.body;
  
  try {
    const { data: newReport, error } = await supabase
      .from('shared_reports')
      .insert({
        client_id: clientId,
        title,
        type: type || 'weekly',
        period_start: periodStart,
        period_end: periodEnd,
        content,
        metrics,
        created_by_user_id: req.user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ id: newReport.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Notifications Routes ───────────────────────────────────────────
app.get('/api/notifications', authenticateToken, async (req: any, res) => {
  try {
    const { data: notifs, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    res.json(notifs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications/unread-count', authenticateToken, async (req: any, res) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);
    
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/read-all', authenticateToken, async (req: any, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Portal Dashboard KPIs ──────────────────────────────────────────
app.get('/api/portal/dashboard/:clientId', authenticateToken, async (req: any, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (req.user.role === 'client' && req.user.clientId !== clientId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar dados em paralelo
    const [clientResult, openTicketsResult, docsResult, reportsResult, updatesResult, sprintsResult] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['open', 'in_progress']),
      supabase.from('shared_documents').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('shared_reports').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('project_updates').select('*, author:users!project_updates_created_by_user_id_fkey(name)').eq('client_id', clientId).order('created_at', { ascending: false }).limit(5),
      supabase.from('sprints').select('*').eq('client_id', clientId).eq('status', 'in_progress')
    ]);

    // Sprint progress
    const { data: allTasks } = await supabase
      .from('sprint_tasks')
      .select('is_completed, sprints!inner(client_id)')
      .eq('sprints.client_id', clientId);
    
    const completed = allTasks?.filter((t: any) => t.is_completed).length || 0;
    const total = allTasks?.length || 0;

    const formattedUpdates = updatesResult.data?.map((u: any) => ({
      ...u,
      author_name: u.author?.name
    })) || [];

    res.json({
      client: clientResult.data,
      openTickets: openTicketsResult.count || 0,
      totalDocuments: docsResult.count || 0,
      totalReports: reportsResult.count || 0,
      recentUpdates: formattedUpdates,
      activeSprints: sprintsResult.data || [],
      sprintProgress: { completed, total },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Seed Data ──────────────────────────────────────────────────────
app.post('/api/seed', async (_req, res) => {
  const canSeed = process.env.NODE_ENV !== 'production' || (process.env.SEED_TOKEN && _req.headers['x-seed-token'] === process.env.SEED_TOKEN);
  if (!canSeed) return res.status(403).json({ error: 'Seed desabilitado neste ambiente' });
  
  try {
    // Nota: Os dados já foram inseridos via supabase-seed.sql
    // Este endpoint agora apenas valida que os dados existem
    const { data: users, error } = await supabase
      .from('users')
      .select('count');
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'Dados já populados via Supabase. Use supabase-seed.sql para re-seed.' 
    });
  } catch (err: any) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.listen(PORT, () => {
  console.log(`Wayzen Client Portal API running on http://localhost:${PORT}`);
});
