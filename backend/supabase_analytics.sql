-- supabase_analytics.sql (updated to match server/controllers/analyticsController.js)

create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  ts          timestamptz not null default now(),
  event_type  text not null check (
    event_type in ('pageview','project_click','resume_click','load_time','client_error','session_end')
  ),
  path        text,
  referrer    text,
  project_id  text,
  load_ms     integer,
  user_agent  text,
  ip          text,
  session_id  text,
  meta        jsonb
);

-- Helpful indexes
create index if not exists analytics_events_ts_idx         on public.analytics_events (ts desc);
create index if not exists analytics_events_type_ts_idx    on public.analytics_events (event_type, ts desc);
create index if not exists analytics_events_session_idx    on public.analytics_events (session_id, ts desc);

-- RLS (service role bypasses, but enable explicitly to be tidy)
alter table public.analytics_events enable row level security;
