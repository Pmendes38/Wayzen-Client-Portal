-- =====================================================
-- WAYZEN - BACKLOG/SPRINT LINK + CHAT UPGRADE
-- =====================================================
-- Execute este script no Supabase SQL Editor.

-- =====================================================
-- HELPER: USER ID DO PORTAL
-- =====================================================
create or replace function public.portal_user_id()
returns bigint as $$
declare
  user_id_result bigint;
begin
  select id into user_id_result
  from public.users
  where auth_user_id = auth.uid();

  return user_id_result;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.portal_user_id() to authenticated, anon;

-- =====================================================
-- SPRINT TASKS: VINCULO COM BACKLOG + DATAS
-- =====================================================
alter table public.sprint_tasks
  add column if not exists backlog_item_id bigint references public.sprint_backlog(id) on delete set null,
  add column if not exists start_date date,
  add column if not exists end_date date;

create index if not exists idx_sprint_tasks_backlog_item on public.sprint_tasks(backlog_item_id);
create index if not exists idx_sprint_tasks_start_date on public.sprint_tasks(start_date);
create index if not exists idx_sprint_tasks_end_date on public.sprint_tasks(end_date);

-- =====================================================
-- CHAT ROOMS
-- =====================================================
create table if not exists public.chat_rooms (
  id bigserial primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  room_type varchar(50) not null check (room_type in ('general', 'internal', 'direct')),
  name varchar(255) not null,
  direct_user_a_id bigint references public.users(id) on delete set null,
  direct_user_b_id bigint references public.users(id) on delete set null,
  created_by_user_id bigint not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint chk_chat_direct_pair check (
    (room_type <> 'direct')
    or (direct_user_a_id is not null and direct_user_b_id is not null and direct_user_a_id <> direct_user_b_id)
  )
);

create unique index if not exists uq_chat_general_room
  on public.chat_rooms(client_id, room_type)
  where room_type in ('general', 'internal');

create unique index if not exists uq_chat_direct_pair
  on public.chat_rooms(client_id, direct_user_a_id, direct_user_b_id)
  where room_type = 'direct';

create index if not exists idx_chat_rooms_client on public.chat_rooms(client_id);

create table if not exists public.chat_messages (
  id bigserial primary key,
  room_id bigint not null references public.chat_rooms(id) on delete cascade,
  user_id bigint not null references public.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_room_date on public.chat_messages(room_id, created_at asc);

-- =====================================================
-- BASE ROOMS (GERAL + INTERNO)
-- =====================================================
insert into public.chat_rooms (client_id, room_type, name, created_by_user_id)
select c.id, 'general', 'Grupo Geral', u.id
from public.clients c
cross join lateral (
  select id from public.users
  where role in ('admin', 'consultant') and is_active = true
  order by id asc
  limit 1
) u
on conflict (client_id, room_type) where room_type in ('general', 'internal') do nothing;

insert into public.chat_rooms (client_id, room_type, name, created_by_user_id)
select c.id, 'internal', 'Grupo Interno', u.id
from public.clients c
cross join lateral (
  select id from public.users
  where role in ('admin', 'consultant') and is_active = true
  order by id asc
  limit 1
) u
on conflict (client_id, room_type) where room_type in ('general', 'internal') do nothing;

-- =====================================================
-- RLS CHAT
-- =====================================================
alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Portal users can read chat rooms" on public.chat_rooms;
create policy "Portal users can read chat rooms"
on public.chat_rooms for select
using (
  (
    (public.portal_is_admin() or public.portal_is_consultant())
    and client_id is not null
  )
  or (
    client_id = public.portal_user_client_id()
    and room_type <> 'internal'
    and (
      room_type <> 'direct'
      or direct_user_a_id = public.portal_user_id()
      or direct_user_b_id = public.portal_user_id()
    )
  )
);

drop policy if exists "Internal can create chat rooms" on public.chat_rooms;
create policy "Internal can create chat rooms"
on public.chat_rooms for insert
with check (
  (public.portal_is_admin() or public.portal_is_consultant())
  or (
    client_id = public.portal_user_client_id()
    and room_type = 'direct'
    and (direct_user_a_id = public.portal_user_id() or direct_user_b_id = public.portal_user_id())
  )
);

drop policy if exists "Portal users can read messages" on public.chat_messages;
create policy "Portal users can read messages"
on public.chat_messages for select
using (
  exists (
    select 1
    from public.chat_rooms r
    where r.id = room_id
      and (
        (public.portal_is_admin() or public.portal_is_consultant())
        or (
          r.client_id = public.portal_user_client_id()
          and r.room_type <> 'internal'
          and (
            r.room_type <> 'direct'
            or r.direct_user_a_id = public.portal_user_id()
            or r.direct_user_b_id = public.portal_user_id()
          )
        )
      )
  )
);

drop policy if exists "Portal users can send messages" on public.chat_messages;
create policy "Portal users can send messages"
on public.chat_messages for insert
with check (
  user_id = public.portal_user_id()
  and exists (
    select 1
    from public.chat_rooms r
    where r.id = room_id
      and (
        (public.portal_is_admin() or public.portal_is_consultant())
        or (
          r.client_id = public.portal_user_client_id()
          and r.room_type <> 'internal'
          and (
            r.room_type <> 'direct'
            or r.direct_user_a_id = public.portal_user_id()
            or r.direct_user_b_id = public.portal_user_id()
          )
        )
      )
  )
);
