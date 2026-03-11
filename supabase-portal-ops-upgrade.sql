-- =====================================================
-- WAYZEN - PORTAL OPS UPGRADE (CONTACTS + CALENDAR)
-- =====================================================
-- Execute este script no Supabase SQL Editor.

create table if not exists public.project_contacts (
  id bigserial primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  name varchar(255) not null,
  role varchar(255) not null,
  email varchar(255) not null,
  phone varchar(50) not null,
  notes text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_contacts_client_id on public.project_contacts(client_id);

create table if not exists public.project_calendar_events (
  id bigint primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  title varchar(255) not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  type varchar(50) not null check (type in ('sprint_delivery', 'meeting', 'transcript', 'general')),
  description text,
  participant_ids bigint[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_calendar_events_client_id on public.project_calendar_events(client_id);
create index if not exists idx_project_calendar_events_start_at on public.project_calendar_events(start_at);

create or replace function public.set_updated_at_project_calendar_events()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_project_calendar_events_updated_at on public.project_calendar_events;
create trigger trg_project_calendar_events_updated_at
before update on public.project_calendar_events
for each row execute function public.set_updated_at_project_calendar_events();

alter table public.project_contacts enable row level security;
alter table public.project_calendar_events enable row level security;

drop policy if exists "Portal users can read project contacts" on public.project_contacts;
create policy "Portal users can read project contacts"
on public.project_contacts for select
using (
  (public.portal_is_admin() or public.portal_is_consultant())
  or client_id = public.portal_user_client_id()
);

drop policy if exists "Internal can write project contacts" on public.project_contacts;
create policy "Internal can write project contacts"
on public.project_contacts for all
using (public.portal_is_admin() or public.portal_is_consultant())
with check (public.portal_is_admin() or public.portal_is_consultant());

drop policy if exists "Portal users can read calendar events" on public.project_calendar_events;
create policy "Portal users can read calendar events"
on public.project_calendar_events for select
using (
  (public.portal_is_admin() or public.portal_is_consultant())
  or client_id = public.portal_user_client_id()
);

drop policy if exists "Internal can write calendar events" on public.project_calendar_events;
create policy "Internal can write calendar events"
on public.project_calendar_events for all
using (public.portal_is_admin() or public.portal_is_consultant())
with check (public.portal_is_admin() or public.portal_is_consultant());
