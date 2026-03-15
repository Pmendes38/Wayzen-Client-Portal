-- =====================================================
-- WAYZEN - PHASE 1 MODEL UPGRADE
-- Sprint <-> Kanban, Chat privacy model, Structured notifications
-- =====================================================

-- =====================================================
-- 1. SPRINT <-> KANBAN: CONTEXT + DATES + RICH FIELDS
-- =====================================================

alter table public.sprint_tasks
  add column if not exists due_date date,
  add column if not exists context_notes text,
  add column if not exists subtasks jsonb not null default '[]'::jsonb,
  add column if not exists attachments jsonb not null default '[]'::jsonb;

alter table public.sprint_backlog
  add column if not exists completed_at timestamptz,
  add column if not exists context_notes text,
  add column if not exists subtasks jsonb not null default '[]'::jsonb,
  add column if not exists attachments jsonb not null default '[]'::jsonb;

create index if not exists idx_sprint_tasks_due_date on public.sprint_tasks(due_date);
create index if not exists idx_sprint_tasks_completed_at on public.sprint_tasks(completed_at desc);
create index if not exists idx_sprint_backlog_completed_at on public.sprint_backlog(completed_at desc);

alter table public.project_calendar_events
  drop constraint if exists project_calendar_events_type_check;

alter table public.project_calendar_events
  add constraint project_calendar_events_type_check
  check (type in (
    'sprint_delivery',
    'meeting',
    'transcript',
    'general',
    'task_due',
    'task_completed'
  ));

create or replace function public.sync_backlog_and_task_completion()
returns trigger as $$
begin
  if new.backlog_item_id is not null then
    update public.sprint_backlog
    set
      status = case when new.is_completed then 'done' else 'in_progress' end,
      completed_at = case when new.is_completed then coalesce(new.completed_at, now()) else null end,
      due_date = coalesce(new.due_date, due_date),
      details = coalesce(new.description, details),
      context_notes = coalesce(new.context_notes, context_notes),
      subtasks = coalesce(new.subtasks, subtasks),
      attachments = coalesce(new.attachments, attachments)
    where id = new.backlog_item_id;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_backlog_and_task_completion on public.sprint_tasks;
create trigger trg_sync_backlog_and_task_completion
after insert or update on public.sprint_tasks
for each row execute function public.sync_backlog_and_task_completion();

-- =====================================================
-- 2. CHAT: PRIVATE DIRECT + GROUP CONVERSATIONS
-- =====================================================

alter table public.chat_rooms
  drop constraint if exists chat_rooms_room_type_check;

alter table public.chat_rooms
  add constraint chat_rooms_room_type_check
  check (room_type in ('general', 'internal', 'direct', 'group'));

create table if not exists public.chat_room_participants (
  room_id bigint not null references public.chat_rooms(id) on delete cascade,
  user_id bigint not null references public.users(id) on delete cascade,
  added_by_user_id bigint references public.users(id) on delete set null,
  is_admin boolean not null default false,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists idx_chat_room_participants_user on public.chat_room_participants(user_id);
create index if not exists idx_chat_room_participants_room on public.chat_room_participants(room_id);

create or replace function public.ensure_chat_room_participants()
returns trigger as $$
begin
  if new.room_type = 'group' then
    insert into public.chat_room_participants (room_id, user_id, added_by_user_id, is_admin)
    values (new.id, new.created_by_user_id, new.created_by_user_id, true)
    on conflict do nothing;
  elsif new.room_type = 'direct' then
    if new.direct_user_a_id is not null then
      insert into public.chat_room_participants (room_id, user_id, added_by_user_id, is_admin)
      values (new.id, new.direct_user_a_id, new.created_by_user_id, new.direct_user_a_id = new.created_by_user_id)
      on conflict do nothing;
    end if;

    if new.direct_user_b_id is not null then
      insert into public.chat_room_participants (room_id, user_id, added_by_user_id, is_admin)
      values (new.id, new.direct_user_b_id, new.created_by_user_id, new.direct_user_b_id = new.created_by_user_id)
      on conflict do nothing;
    end if;

    insert into public.chat_room_participants (room_id, user_id, added_by_user_id, is_admin)
    values (new.id, new.created_by_user_id, new.created_by_user_id, true)
    on conflict do nothing;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_ensure_chat_room_participants on public.chat_rooms;
create trigger trg_ensure_chat_room_participants
after insert on public.chat_rooms
for each row execute function public.ensure_chat_room_participants();

insert into public.chat_room_participants (room_id, user_id, added_by_user_id, is_admin)
select r.id, r.direct_user_a_id, r.created_by_user_id, true
from public.chat_rooms r
where r.room_type = 'direct'
  and r.direct_user_a_id is not null
on conflict do nothing;

insert into public.chat_room_participants (room_id, user_id, added_by_user_id, is_admin)
select r.id, r.direct_user_b_id, r.created_by_user_id, false
from public.chat_rooms r
where r.room_type = 'direct'
  and r.direct_user_b_id is not null
on conflict do nothing;

alter table public.chat_room_participants enable row level security;

drop policy if exists "Participants can read room participants" on public.chat_room_participants;
create policy "Participants can read room participants"
on public.chat_room_participants for select
using (
  exists (
    select 1
    from public.chat_room_participants p
    where p.room_id = chat_room_participants.room_id
      and p.user_id = public.portal_user_id()
  )
  or public.portal_is_admin()
  or public.portal_is_consultant()
);

drop policy if exists "Participants admins can manage room participants" on public.chat_room_participants;
create policy "Participants admins can manage room participants"
on public.chat_room_participants for all
using (
  exists (
    select 1
    from public.chat_room_participants p
    where p.room_id = chat_room_participants.room_id
      and p.user_id = public.portal_user_id()
      and p.is_admin = true
  )
  or public.portal_is_admin()
  or public.portal_is_consultant()
)
with check (
  exists (
    select 1
    from public.chat_room_participants p
    where p.room_id = chat_room_participants.room_id
      and p.user_id = public.portal_user_id()
      and p.is_admin = true
  )
  or public.portal_is_admin()
  or public.portal_is_consultant()
);

drop policy if exists "Portal users can read chat rooms" on public.chat_rooms;
create policy "Portal users can read chat rooms"
on public.chat_rooms for select
using (
  (
    room_type in ('general', 'internal')
    and (
      (public.portal_is_admin() or public.portal_is_consultant())
      or (
        room_type = 'general'
        and client_id = public.portal_user_client_id()
      )
    )
  )
  or exists (
    select 1
    from public.chat_room_participants p
    where p.room_id = chat_rooms.id
      and p.user_id = public.portal_user_id()
  )
);

drop policy if exists "Internal can create chat rooms" on public.chat_rooms;
create policy "Internal can create chat rooms"
on public.chat_rooms for insert
with check (
  public.portal_is_admin()
  or public.portal_is_consultant()
  or (
    room_type in ('direct', 'group')
    and created_by_user_id = public.portal_user_id()
    and client_id = public.portal_user_client_id()
  )
);

drop policy if exists "Portal users can read messages" on public.chat_messages;
create policy "Portal users can read messages"
on public.chat_messages for select
using (
  exists (
    select 1
    from public.chat_rooms r
    left join public.chat_room_participants p on p.room_id = r.id and p.user_id = public.portal_user_id()
    where r.id = room_id
      and (
        (
          r.room_type in ('general', 'internal')
          and (
            (public.portal_is_admin() or public.portal_is_consultant())
            or (r.room_type = 'general' and r.client_id = public.portal_user_client_id())
          )
        )
        or p.user_id is not null
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
    left join public.chat_room_participants p on p.room_id = r.id and p.user_id = public.portal_user_id()
    where r.id = room_id
      and (
        (
          r.room_type in ('general', 'internal')
          and (
            (public.portal_is_admin() or public.portal_is_consultant())
            or (r.room_type = 'general' and r.client_id = public.portal_user_client_id())
          )
        )
        or p.user_id is not null
      )
  )
);

-- =====================================================
-- 3. NOTIFICATIONS: STRUCTURED EVENT MODEL
-- =====================================================

alter table public.notifications
  add column if not exists category varchar(50) not null default 'system',
  add column if not exists event_type varchar(100) not null default 'system.generic',
  add column if not exists occurred_at timestamptz not null default now(),
  add column if not exists read_at timestamptz,
  add column if not exists link_to text,
  add column if not exists source_entity_type varchar(100),
  add column if not exists source_entity_id bigint,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
on public.notifications for select
using (
  user_id = public.portal_user_id()
);

drop policy if exists "Admins can view all notifications" on public.notifications;
create policy "Admins can view all notifications"
on public.notifications for select
using (public.portal_is_admin());

drop policy if exists "Users can update their notifications" on public.notifications;
create policy "Users can update their notifications"
on public.notifications for update
using (
  user_id = public.portal_user_id()
)
with check (
  user_id = public.portal_user_id()
);

drop policy if exists "Service role can create notifications" on public.notifications;
create policy "Service role can create notifications"
on public.notifications for insert
with check (true);

drop policy if exists "Portal users can create scoped notifications" on public.notifications;
create policy "Portal users can create scoped notifications"
on public.notifications for insert
with check (
  exists (
    select 1
    from public.users target_user
    where target_user.id = notifications.user_id
      and (
        public.portal_is_admin()
        or public.portal_is_consultant()
        or target_user.id = public.portal_user_id()
        or target_user.role in ('admin', 'consultant')
        or target_user.client_id = public.portal_user_client_id()
      )
  )
);

create index if not exists idx_notifications_user_occurred_at on public.notifications(user_id, occurred_at desc);
create index if not exists idx_notifications_category on public.notifications(category);
create index if not exists idx_notifications_event_type on public.notifications(event_type);
create index if not exists idx_notifications_source on public.notifications(source_entity_type, source_entity_id);
