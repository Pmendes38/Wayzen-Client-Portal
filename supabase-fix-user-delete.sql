-- =====================================================
-- WAYZEN - FIX USER DELETION
-- Problema: colunas de autoria são NOT NULL + ON DELETE RESTRICT,
-- bloqueando deletes de usuários que criaram registros.
--
-- Solução:
--   1. Tornar nullable + mudar para ON DELETE SET NULL nas colunas
--      de autoria (histórico preservado, autor vira NULL)
--   2. Criar RPC delete_portal_user que limpa dependências restantes
--      antes de deletar o registro em public.users
--
-- Execute no Supabase SQL Editor (produção).
-- =====================================================

-- =====================================================
-- 1. SPRINT_BACKLOG: created_by_user_id → SET NULL
-- =====================================================
alter table public.sprint_backlog
  alter column created_by_user_id drop not null;

alter table public.sprint_backlog
  drop constraint if exists sprint_backlog_created_by_user_id_fkey;

alter table public.sprint_backlog
  add constraint sprint_backlog_created_by_user_id_fkey
  foreign key (created_by_user_id)
  references public.users(id)
  on delete set null;

-- =====================================================
-- 2. DAILY_LOGS: consultant_user_id → SET NULL
-- =====================================================
alter table public.daily_logs
  alter column consultant_user_id drop not null;

alter table public.daily_logs
  drop constraint if exists daily_logs_consultant_user_id_fkey;

alter table public.daily_logs
  add constraint daily_logs_consultant_user_id_fkey
  foreign key (consultant_user_id)
  references public.users(id)
  on delete set null;

-- =====================================================
-- 3. MEETING_EVENTS: created_by_user_id → SET NULL
-- =====================================================
alter table public.meeting_events
  alter column created_by_user_id drop not null;

alter table public.meeting_events
  drop constraint if exists meeting_events_created_by_user_id_fkey;

alter table public.meeting_events
  add constraint meeting_events_created_by_user_id_fkey
  foreign key (created_by_user_id)
  references public.users(id)
  on delete set null;

-- =====================================================
-- 4. CHAT_ROOMS: created_by_user_id → SET NULL
-- =====================================================
alter table public.chat_rooms
  alter column created_by_user_id drop not null;

alter table public.chat_rooms
  drop constraint if exists chat_rooms_created_by_user_id_fkey;

alter table public.chat_rooms
  add constraint chat_rooms_created_by_user_id_fkey
  foreign key (created_by_user_id)
  references public.users(id)
  on delete set null;

-- =====================================================
-- 5. RPC: delete_portal_user
--    Limpa registros sem CASCADE antes de deletar o user.
--    Usa security definer para bypassar RLS.
--    Apenas admins podem invocar.
-- =====================================================
create or replace function public.delete_portal_user(p_user_id bigint)
returns void
language plpgsql
security definer
as $$
begin
  -- Apenas administradores podem excluir usuários
  if not public.portal_is_admin() then
    raise exception 'Permissao negada: apenas administradores podem excluir usuarios.';
  end if;

  -- Mensagens de ticket vinculadas ao usuário
  delete from public.ticket_messages where user_id = p_user_id;

  -- Tickets abertos pelo usuário
  delete from public.tickets where user_id = p_user_id;

  -- Documentos enviados pelo usuário
  delete from public.shared_documents where uploaded_by_user_id = p_user_id;

  -- Relatórios criados pelo usuário
  delete from public.shared_reports where created_by_user_id = p_user_id;

  -- Atualizações de projeto criadas pelo usuário
  delete from public.project_updates where created_by_user_id = p_user_id;

  -- Notificações do usuário
  delete from public.notifications where user_id = p_user_id;

  -- Participação em salas de chat (cascade já cobre, mas explícito é seguro)
  delete from public.chat_room_participants where user_id = p_user_id;

  -- Finalmente deleta o registro do usuário.
  -- FKs restantes:
  --   sprint_backlog.created_by_user_id   → SET NULL (passo 1)
  --   daily_logs.consultant_user_id       → SET NULL (passo 2)
  --   meeting_events.created_by_user_id   → SET NULL (passo 3)
  --   chat_rooms.created_by_user_id       → SET NULL (passo 4)
  --   chat_room_participants.user_id      → CASCADE (já existia)
  --   chat_messages.user_id              → CASCADE (já existia)
  --   notifications.user_id              → deletado acima
  delete from public.users where id = p_user_id;
end;
$$;

-- Revogar acesso público, garantir que só authenticated pode chamar
revoke all on function public.delete_portal_user(bigint) from public;
grant execute on function public.delete_portal_user(bigint) to authenticated;

-- =====================================================
-- VERIFICAÇÃO (rode apos a migration)
-- =====================================================
-- select routine_name from information_schema.routines
-- where routine_name = 'delete_portal_user' and routine_schema = 'public';
