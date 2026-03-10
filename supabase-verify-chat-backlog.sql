-- =====================================================
-- WAYZEN - VERIFICACAO BACKLOG + CHAT
-- =====================================================
-- Execute apos rodar: supabase-chat-backlog-upgrade.sql

-- 1) Estrutura sprint_tasks extendida
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sprint_tasks'
  and column_name in ('backlog_item_id', 'start_date', 'end_date')
order by column_name;

-- 2) Tabelas de chat criadas
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('chat_rooms', 'chat_messages')
order by table_name;

-- 3) Salas base por cliente (geral + interno)
select
  c.id as client_id,
  c.company_name,
  count(*) filter (where r.room_type = 'general') as general_rooms,
  count(*) filter (where r.room_type = 'internal') as internal_rooms,
  count(*) filter (where r.room_type = 'direct') as direct_rooms
from public.clients c
left join public.chat_rooms r on r.client_id = c.id
group by c.id, c.company_name
order by c.id;

-- 4) Politicas RLS do chat
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('chat_rooms', 'chat_messages')
order by tablename, policyname;

-- 5) Amostra de vinculos backlog -> atividade
select
  sb.id as backlog_id,
  sb.title as backlog_title,
  st.id as task_id,
  st.title as task_title,
  st.start_date,
  st.end_date,
  st.is_completed
from public.sprint_backlog sb
left join public.sprint_tasks st on st.backlog_item_id = sb.id
order by sb.id desc, st.id desc
limit 50;
