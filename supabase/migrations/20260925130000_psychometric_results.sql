-- Self-reflection results saved to a profile (FEATURES_BRIEF §5). NOT YET
-- APPLIED to the remote project — review, then apply deliberately.
--
-- Opt-in copy of an on-device result. Sensitive, health-adjacent data: the
-- owner can insert, read and delete their own rows; nobody else can read
-- them, and no public RPC may ever join this table.

create table if not exists public.psychometric_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  test_id text not null,
  version integer not null,
  scores jsonb not null,
  taken_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.psychometric_results enable row level security;

create policy psychometric_results_select_own
  on public.psychometric_results for select
  to authenticated
  using (auth.uid() = user_id);

create policy psychometric_results_insert_own
  on public.psychometric_results for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy psychometric_results_delete_own
  on public.psychometric_results for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists psychometric_results_user_idx on public.psychometric_results (user_id, taken_at desc);
