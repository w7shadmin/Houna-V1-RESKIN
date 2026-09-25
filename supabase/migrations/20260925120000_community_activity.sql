-- Home community card (FEATURES_BRIEF §1).
-- Applied to the remote project 2026-09-25.
--
-- activity_pings: one anonymous row per breathing/meditation session start,
-- for Guests and Aliases alike, so the counter isn't Alias-only. Same shape
-- of privacy as mood_pings: no user id, insert-only, no SELECT policy —
-- reads happen only through the aggregate RPC below.

create table if not exists public.activity_pings (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('breathing', 'meditation')),
  -- ISO 3166-1 alpha-2 from profiles.country; null for Guests / no country.
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  pinged_at timestamptz not null default now()
);

alter table public.activity_pings enable row level security;

-- Clients may only record "now", never backfill or future-date pings.
create policy activity_pings_insert_anyone
  on public.activity_pings
  for insert
  to anon, authenticated
  with check (pinged_at between now() - interval '5 minutes' and now() + interval '1 minute');

create index if not exists activity_pings_pinged_at_idx on public.activity_pings (pinged_at);

-- Aggregates only — never user ids. `total_people` counts distinct signed-in
-- Aliases with a completed session in the period (Guests can't be counted as
-- people: pings carry no identity). `total_sessions` counts every ping.
create or replace function public.get_community_activity(period text default '24h')
returns table (total_sessions bigint, total_people bigint, countries jsonb)
language sql
security definer
set search_path to 'public'
as $$
  with bounds as (
    select now() - case period
      when 'week' then interval '7 days'
      when 'month' then interval '30 days'
      else interval '24 hours'
    end as since
  ),
  pings as (
    select ap.country from activity_pings ap, bounds b where ap.pinged_at >= b.since
  ),
  people as (
    select count(distinct ts.user_id) as n
    from tanafas_sessions ts, bounds b
    where ts.started_at >= b.since and ts.kind in ('breathing', 'meditation')
  )
  select
    (select count(*) from pings),
    (select n from people),
    coalesce(
      (select jsonb_agg(jsonb_build_object('country', country, 'count', c) order by c desc)
       from (select country, count(*) as c from pings where country is not null group by country) g),
      '[]'::jsonb
    );
$$;

grant execute on function public.get_community_activity(text) to anon, authenticated;
