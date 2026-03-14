    -- =====================================================
    -- WAYZEN - INTERNAL OPERATIONS EXTENSIONS
    -- =====================================================
    -- Tabelas para operacao diaria interna, backlog e agenda/transcricoes.
    -- Execute no Supabase SQL Editor apos schema principal.

    -- =====================================================
    -- SPRINT BACKLOG (interno)
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

    -- =====================================================
    -- DAILY LOGS (interno)
    -- =====================================================
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

    -- =====================================================
    -- MEETING EVENTS + TRANSCRIPTS
    -- =====================================================
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
    -- RLS
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

    -- daily_logs: interno escreve, cliente apenas le do proprio portal
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

    -- meeting_events: interno escreve, cliente le os proprios
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
