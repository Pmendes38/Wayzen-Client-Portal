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

-- =====================================================
-- MARKETING INPUTS (used by Analytics + Reports)
-- =====================================================

create table if not exists public.marketing_data_entries (
  id bigserial primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  period_date date not null,
  channel varchar(120) not null,
  campaign_name varchar(255) not null,
  spend numeric(12,2) not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  leads integer not null default 0,
  meetings_booked integer not null default 0,
  proposals_sent integer not null default 0,
  deals_won integer not null default 0,
  revenue numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_data_entries_client_period
  on public.marketing_data_entries(client_id, period_date desc);

alter table public.marketing_data_entries enable row level security;

drop policy if exists "Portal users can read marketing data entries" on public.marketing_data_entries;
create policy "Portal users can read marketing data entries"
on public.marketing_data_entries for select
using (
  (public.portal_is_admin() or public.portal_is_consultant())
  or client_id = public.portal_user_client_id()
);

drop policy if exists "Internal can write marketing data entries" on public.marketing_data_entries;
create policy "Internal can write marketing data entries"
on public.marketing_data_entries for all
using (public.portal_is_admin() or public.portal_is_consultant())
with check (public.portal_is_admin() or public.portal_is_consultant());

-- =====================================================
-- DAILY OPERATIONAL SNAPSHOTS (sheet feeding Analytics)
-- =====================================================

create table if not exists public.daily_operational_snapshots (
  id bigserial primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  snapshot_date date not null,
  sla_first_response_minutes numeric(10,2) not null default 0,
  leads_whatsapp integer not null default 0,
  leads_instagram integer not null default 0,
  leads_site integer not null default 0,
  leads_referral integer not null default 0,
  leads_unanswered integer not null default 0,
  opportunities_contato_inicial integer not null default 0,
  opportunities_qualificado integer not null default 0,
  opportunities_proposta_enviada integer not null default 0,
  opportunities_negociacao integer not null default 0,
  opportunities_fechado integer not null default 0,
  followups_done integer not null default 0,
  followups_overdue integer not null default 0,
  conversion_rate_week numeric(10,2) not null default 0,
  enrollments_month integer not null default 0,
  loa_revenue_month numeric(12,2) not null default 0,
  avg_ticket numeric(12,2) not null default 0,
  monthly_goal numeric(12,2) not null default 0,
  monthly_realized numeric(12,2) not null default 0,
  churn_month integer not null default 0,
  delinquency_rate numeric(10,2) not null default 0,
  nps_weekly numeric(10,2) not null default 0,
  wayzen_activities_today integer not null default 0,
  wow_conversion_var numeric(10,2) not null default 0,
  baseline_conversion_rate numeric(10,2) not null default 0,
  baseline_monthly_revenue numeric(12,2) not null default 0,
  baseline_avg_ticket numeric(12,2) not null default 0,
  current_conversion_rate numeric(10,2) not null default 0,
  current_monthly_revenue numeric(12,2) not null default 0,
  current_avg_ticket numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, snapshot_date)
);

create index if not exists idx_daily_operational_snapshots_client_date
  on public.daily_operational_snapshots(client_id, snapshot_date desc);

create or replace function public.set_updated_at_daily_operational_snapshots()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_daily_operational_snapshots_updated_at on public.daily_operational_snapshots;
create trigger trg_daily_operational_snapshots_updated_at
before update on public.daily_operational_snapshots
for each row execute function public.set_updated_at_daily_operational_snapshots();

alter table public.daily_operational_snapshots enable row level security;

drop policy if exists "Portal users can read daily operational snapshots" on public.daily_operational_snapshots;
create policy "Portal users can read daily operational snapshots"
on public.daily_operational_snapshots for select
using (
  (public.portal_is_admin() or public.portal_is_consultant())
  or client_id = public.portal_user_client_id()
);

drop policy if exists "Internal can write daily operational snapshots" on public.daily_operational_snapshots;
create policy "Internal can write daily operational snapshots"
on public.daily_operational_snapshots for all
using (public.portal_is_admin() or public.portal_is_consultant())
with check (public.portal_is_admin() or public.portal_is_consultant());
