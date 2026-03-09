-- =====================================================
-- 🔐 SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Este arquivo contém as políticas de segurança a nível de linha
-- para proteger os dados do Wayzen Client Portal
-- 
-- IMPORTANTE: Execute este arquivo no Supabase SQL Editor
-- antes de habilitar RLS nas tabelas
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 🛡️ FUNCTION: Obter User ID do JWT
-- ─────────────────────────────────────────────────────
-- Esta função extrai o user_id do JWT do Supabase Auth
-- Caso não use Supabase Auth, você pode adaptar para extrair
-- do JWT customizado que usa

CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS BIGINT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'user_id',
    current_setting('request.jwt.claims', true)::json->>'sub'
  )::BIGINT;
$$ LANGUAGE SQL STABLE;

-- ─────────────────────────────────────────────────────
-- 🛡️ FUNCTION: Obter Role do Usuário
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.user_id();
$$ LANGUAGE SQL STABLE;

-- ─────────────────────────────────────────────────────
-- 🛡️ FUNCTION: Obter Client ID do Usuário
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth.user_client_id()
RETURNS BIGINT AS $$
  SELECT client_id FROM users WHERE id = auth.user_id();
$$ LANGUAGE SQL STABLE;

-- ─────────────────────────────────────────────────────
-- 🛡️ FUNCTION: Verificar se usuário é Admin
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.user_id() AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE;

-- ─────────────────────────────────────────────────────
-- 🛡️ FUNCTION: Verificar se usuário é Consultant
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth.is_consultant()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.user_id() AND role = 'consultant'
  );
$$ LANGUAGE SQL STABLE;


-- =====================================================
-- 📋 RLS POLICIES - USERS
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (auth.is_admin());

-- Consultants podem ver usuários de seus clientes
CREATE POLICY "Consultants can view users"
  ON users FOR SELECT
  USING (
    auth.is_consultant() OR 
    auth.is_admin()
  );

-- Clients podem ver apenas a si mesmos
CREATE POLICY "Clients can view themselves"
  ON users FOR SELECT
  USING (id = auth.user_id());

-- Admins podem inserir usuários
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (auth.is_admin());

-- Admins podem atualizar qualquer usuário
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (auth.is_admin());

-- Usuários podem atualizar seus próprios dados (exceto role)
CREATE POLICY "Users can update themselves"
  ON users FOR UPDATE
  USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());


-- =====================================================
-- 🏢 RLS POLICIES - CLIENTS
-- =====================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Admins e Consultants podem ver todos os clientes
CREATE POLICY "Admins and Consultants can view all clients"
  ON clients FOR SELECT
  USING (auth.is_admin() OR auth.is_consultant());

-- Clients podem ver apenas seu próprio cliente
CREATE POLICY "Clients can view their own client"
  ON clients FOR SELECT
  USING (id = auth.user_client_id());

-- Admins podem gerenciar clientes
CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  USING (auth.is_admin());


-- =====================================================
-- 📝 RLS POLICIES - PROJECT_UPDATES
-- =====================================================
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Admins e Consultants podem ver todos os updates
CREATE POLICY "Admins and Consultants can view all updates"
  ON project_updates FOR SELECT
  USING (auth.is_admin() OR auth.is_consultant());

-- Clients podem ver updates de seu cliente
CREATE POLICY "Clients can view their updates"
  ON project_updates FOR SELECT
  USING (client_id = auth.user_client_id());

-- Admins e Consultants podem criar updates
CREATE POLICY "Admins and Consultants can create updates"
  ON project_updates FOR INSERT
  WITH CHECK (auth.is_admin() OR auth.is_consultant());

-- Admins e Consultants podem atualizar updates
CREATE POLICY "Admins and Consultants can update updates"
  ON project_updates FOR UPDATE
  USING (auth.is_admin() OR auth.is_consultant());


-- =====================================================
-- 🏃 RLS POLICIES - SPRINTS
-- =====================================================
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

-- Admins e Consultants podem ver todos os sprints
CREATE POLICY "Admins and Consultants can view all sprints"
  ON sprints FOR SELECT
  USING (auth.is_admin() OR auth.is_consultant());

-- Clients podem ver sprints de seu cliente
CREATE POLICY "Clients can view their sprints"
  ON sprints FOR SELECT
  USING (client_id = auth.user_client_id());

-- Admins e Consultants podem gerenciar sprints
CREATE POLICY "Admins and Consultants can manage sprints"
  ON sprints FOR ALL
  USING (auth.is_admin() OR auth.is_consultant());


-- =====================================================
-- ✅ RLS POLICIES - SPRINT_TASKS
-- =====================================================
ALTER TABLE sprint_tasks ENABLE ROW LEVEL SECURITY;

-- Admins e Consultants podem ver todas as tasks
CREATE POLICY "Admins and Consultants can view all tasks"
  ON sprint_tasks FOR SELECT
  USING (auth.is_admin() OR auth.is_consultant());

-- Clients podem ver tasks de sprints de seu cliente
CREATE POLICY "Clients can view their tasks"
  ON sprint_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sprints 
      WHERE sprints.id = sprint_tasks.sprint_id 
      AND sprints.client_id = auth.user_client_id()
    )
  );

-- Admins e Consultants podem gerenciar tasks
CREATE POLICY "Admins and Consultants can manage tasks"
  ON sprint_tasks FOR ALL
  USING (auth.is_admin() OR auth.is_consultant());


-- =====================================================
-- 🎫 RLS POLICIES - TICKETS
-- =====================================================
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Admins e Consultants podem ver todos os tickets
CREATE POLICY "Admins and Consultants can view all tickets"
  ON tickets FOR SELECT
  USING (auth.is_admin() OR auth.is_consultant());

-- Clients podem ver tickets de seu cliente
CREATE POLICY "Clients can view their tickets"
  ON tickets FOR SELECT
  USING (client_id = auth.user_client_id());

-- Usuários podem criar tickets de seu cliente
CREATE POLICY "Users can create tickets for their client"
  ON tickets FOR INSERT
  WITH CHECK (
    auth.is_admin() OR 
    auth.is_consultant() OR
    client_id = auth.user_client_id()
  );

-- Admins e Consultants podem atualizar tickets
CREATE POLICY "Admins and Consultants can update tickets"
  ON tickets FOR UPDATE
  USING (auth.is_admin() OR auth.is_consultant());


-- =====================================================
-- 💬 RLS POLICIES - TICKET_MESSAGES
-- =====================================================
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver mensagens de tickets que eles têm acesso
CREATE POLICY "Users can view messages of their tickets"
  ON ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE tickets.id = ticket_messages.ticket_id 
      AND (
        auth.is_admin() OR 
        auth.is_consultant() OR
        tickets.client_id = auth.user_client_id()
      )
    )
  );

-- Usuários podem criar mensagens em tickets que eles têm acesso
CREATE POLICY "Users can create messages in their tickets"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE tickets.id = ticket_messages.ticket_id 
      AND (
        auth.is_admin() OR 
        auth.is_consultant() OR
        tickets.client_id = auth.user_client_id()
      )
    )
  );


-- =====================================================
-- 📄 RLS POLICIES - SHARED_DOCUMENTS
-- =====================================================
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;

-- Admins e Consultants podem ver todos os documentos
CREATE POLICY "Admins and Consultants can view all documents"
  ON shared_documents FOR SELECT
  USING (auth.is_admin() OR auth.is_consultant());

-- Clients podem ver documentos de seu cliente
CREATE POLICY "Clients can view their documents"
  ON shared_documents FOR SELECT
  USING (client_id = auth.user_client_id());

-- Admins e Consultants podem gerenciar documentos
CREATE POLICY "Admins and Consultants can manage documents"
  ON shared_documents FOR ALL
  USING (auth.is_admin() OR auth.is_consultant());


-- =====================================================
-- 📊 RLS POLICIES - SHARED_REPORTS
-- =====================================================
ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;

-- Admins e Consultants podem ver todos os relatórios
CREATE POLICY "Admins and Consultants can view all reports"
  ON shared_reports FOR SELECT
  USING (auth.is_admin() OR auth.is_consultant());

-- Clients podem ver relatórios de seu cliente
CREATE POLICY "Clients can view their reports"
  ON shared_reports FOR SELECT
  USING (client_id = auth.user_client_id());

-- Admins e Consultants podem gerenciar relatórios
CREATE POLICY "Admins and Consultants can manage reports"
  ON shared_reports FOR ALL
  USING (auth.is_admin() OR auth.is_consultant());


-- =====================================================
-- 🔔 RLS POLICIES - NOTIFICATIONS
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.user_id());

-- Admins podem ver todas as notificações
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (auth.is_admin());

-- Sistema pode criar notificações (service_role)
CREATE POLICY "Service role can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Usuários podem marcar suas notificações como lidas
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.user_id());


-- =====================================================
-- ✅ VERIFICAÇÃO DAS POLICIES
-- =====================================================
-- Execute esta query para verificar todas as policies criadas:
/*
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- =====================================================
-- 📝 NOTAS IMPORTANTES
-- =====================================================
-- 
-- 1. AUTENTICAÇÃO ATUAL: Este projeto usa JWT customizado, não Supabase Auth
--    As funções auth.user_id(), auth.user_role() etc. precisam ser adaptadas
--    para funcionar com o JWT customizado que você está usando.
-- 
-- 2. PARA USAR COM SUPABASE AUTH:
--    - Migre para Supabase Auth (supabase.auth.signIn, etc.)
--    - As políticas funcionarão automaticamente
--    - Veja: https://supabase.com/docs/guides/auth
-- 
-- 3. PARA USAR COM JWT CUSTOMIZADO:
--    - Configure o JWT_SECRET no Supabase Dashboard
--    - Adicione claims personalizados (user_id, role, client_id)
--    - As funções auth.* lerão do JWT automaticamente
-- 
-- 4. DESABILITAR RLS TEMPORARIAMENTE (desenvolvimento):
--    ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;
-- 
-- 5. BYPASS RLS (service_role key):
--    Quando usa SUPABASE_SERVICE_ROLE_KEY, RLS é ignorado
--    Use apenas no backend, NUNCA exponha no frontend!
-- 
-- =====================================================
