-- =====================================================
-- WAYZEN FIX COMPLETO - EXECUTA TUDO EM SEQUÊNCIA
-- =====================================================
-- Este script corrige os problemas de login:
-- 1. Cria as funções RLS helpers
-- 2. Vincula auth.users com public.users via auth_user_id
-- 3. Define os roles (admin/consultant/client)
-- 4. Cria as tabelas de operações internas
-- 5. Configura as políticas RLS

-- =====================================================
-- PASSO 1: CRIAR FUNÇÕES RLS HELPERS
-- =====================================================

-- Função para detectar se é admin
create or replace function public.portal_is_admin()
returns boolean as $$
declare
  user_role text;
begin
  select role into user_role
  from public.users
  where auth_user_id = auth.uid();
  
  return user_role = 'admin';
end;
$$ language plpgsql security definer set search_path = public;

-- Função para detectar se é consultant
create or replace function public.portal_is_consultant()
returns boolean as $$
declare
  user_role text;
begin
  select role into user_role
  from public.users
  where auth_user_id = auth.uid();
  
  return user_role = 'consultant';
end;
$$ language plpgsql security definer set search_path = public;

-- Função para obter client_id do usuário autenticado
create or replace function public.portal_user_client_id()
returns bigint as $$
declare
  client_id_result bigint;
begin
  select client_id into client_id_result
  from public.users
  where auth_user_id = auth.uid();
  
  return client_id_result;
end;
$$ language plpgsql security definer set search_path = public;

-- Conceder permissões de execução nas funções
grant execute on function public.portal_is_admin() to authenticated, anon;
grant execute on function public.portal_is_consultant() to authenticated, anon;
grant execute on function public.portal_user_client_id() to authenticated, anon;

-- =====================================================
-- PASSO 2: GARANTIR QUE COLUNA auth_user_id EXISTE
-- =====================================================

-- Adicionar coluna auth_user_id se não existir
alter table public.users
add column if not exists auth_user_id uuid;

-- Criar índice na coluna
create index if not exists idx_users_auth_user_id on public.users(auth_user_id);

-- =====================================================
-- PASSO 3: VINCULAR auth.users COM public.users
-- =====================================================

-- Atualizar users existentes: usar email para vincular
update public.users u
set auth_user_id = au.id
from auth.users au
where au.email = u.email
and u.auth_user_id is null;

-- Verificar se algum usuário ainda está sem auth_user_id
-- (Se houver erros de login após executar, pode ser que contas antigas precisem ser sincronizadas manualmente)

-- =====================================================
-- PASSO 4: DEFINIR ROLES (ADMIN/CONSULTANT/CLIENT)
-- =====================================================

-- Atualizar o primeiro usuário para 'admin' (ou escolha outro email)
update public.users
set role = 'admin'
where email = 'admin@wayzen.com'
or email = 'pedro@mendesds@gmail.com';  -- ou qualquer email de admin

-- Se você tiver consultores, defina assim:
-- update public.users set role = 'consultant' where email = 'consultor@wayzen.com';

-- Todos os outros são 'client' por padrão
update public.users
set role = 'client'
where role is null or role = '';

-- =====================================================
-- PASSO 5: CRIAR TABELAS DE OPERAÇÕES INTERNAS
-- =====================================================

create table if not exists public.sprint_backlog (
  id bigserial primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  sprint_id bigint references public.sprints(id) on delete set null,
  title varchar(255) not null,
  details text,
  status varchar(50) not null default 'planned' check (status in ('planned', 'in_progress', 'done')),
  occurred_on date,
  due_date date,
  created_by_user_id bigint not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_sprint_backlog_client on public.sprint_backlog(client_id);
create index if not exists idx_sprint_backlog_due_date on public.sprint_backlog(due_date);

create table if not exists public.daily_logs (
  id bigserial primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  consultant_user_id bigint not null references public.users(id) on delete restrict,
  log_date date not null,
  progress_score integer not null check (progress_score >= 0 and progress_score <= 100),
  hours_worked numeric(5,2) not null default 0,
  summary text not null,
  blockers text,
  next_steps text,
  created_at timestamptz not null default now(),
  unique (client_id, consultant_user_id, log_date)
);

create index if not exists idx_daily_logs_client_date on public.daily_logs(client_id, log_date desc);

create table if not exists public.meeting_events (
  id bigserial primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  title varchar(255) not null,
  meeting_date timestamptz not null,
  meeting_type varchar(50) not null default 'meeting' check (meeting_type in ('meeting', 'call')),
  transcript text,
  notes text,
  created_by_user_id bigint not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_meeting_events_client_date on public.meeting_events(client_id, meeting_date asc);

-- =====================================================
-- PASSO 6: HABILITAR RLS E CRIAR POLÍTICAS
-- =====================================================

alter table public.sprint_backlog enable row level security;
alter table public.daily_logs enable row level security;
alter table public.meeting_events enable row level security;

-- sprint_backlog: apenas equipe interna
drop policy if exists "Internal can read sprint backlog" on public.sprint_backlog;
create policy "Internal can read sprint backlog"
on public.sprint_backlog for select
using (public.portal_is_admin() or public.portal_is_consultant());

drop policy if exists "Internal can write sprint backlog" on public.sprint_backlog;
create policy "Internal can write sprint backlog"
on public.sprint_backlog for insert
with check (public.portal_is_admin() or public.portal_is_consultant());

-- daily_logs: interno escreve, cliente lê do próprio portal
drop policy if exists "Internal can read daily logs" on public.daily_logs;
create policy "Internal can read daily logs"
on public.daily_logs for select
using (public.portal_is_admin() or public.portal_is_consultant());

drop policy if exists "Client can read own daily logs" on public.daily_logs;
create policy "Client can read own daily logs"
on public.daily_logs for select
using (client_id = public.portal_user_client_id());

drop policy if exists "Internal can write daily logs" on public.daily_logs;
create policy "Internal can write daily logs"
on public.daily_logs for insert
with check (public.portal_is_admin() or public.portal_is_consultant());

-- meeting_events: interno escreve, cliente lê os próprios
drop policy if exists "Internal can read meeting events" on public.meeting_events;
create policy "Internal can read meeting events"
on public.meeting_events for select
using (public.portal_is_admin() or public.portal_is_consultant());

drop policy if exists "Client can read own meeting events" on public.meeting_events;
create policy "Client can read own meeting events"
on public.meeting_events for select
using (client_id = public.portal_user_client_id());

drop policy if exists "Internal can write meeting events" on public.meeting_events;
create policy "Internal can write meeting events"
on public.meeting_events for insert
with check (public.portal_is_admin() or public.portal_is_consultant());

-- =====================================================
-- FINALIZADO
-- =====================================================
-- Script executado com sucesso!
-- Agora tente fazer login novamente.
-- Se ainda falhar, verifique:
-- 1. O email existe em auth.users?
-- 2. A coluna "role" foi populada?
-- 3. Há algum erro no console do navegador? (F12 → Console)
