-- Idempotent hotfix for user-scoped daily logs.
-- Safe to run multiple times in Supabase SQL Editor.

create table if not exists public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  progress integer,
  hours_worked numeric,
  summary text,
  blockers text,
  next_steps text,
  created_at timestamptz default now(),
  unique (user_id, date)
);

create index if not exists idx_daily_logs_user_date
  on public.daily_logs(user_id, date desc);

alter table public.daily_logs enable row level security;

drop policy if exists "Users can read own daily logs" on public.daily_logs;
create policy "Users can read own daily logs"
on public.daily_logs for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own daily logs" on public.daily_logs;
create policy "Users can insert own daily logs"
on public.daily_logs for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily logs" on public.daily_logs;
create policy "Users can update own daily logs"
on public.daily_logs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
