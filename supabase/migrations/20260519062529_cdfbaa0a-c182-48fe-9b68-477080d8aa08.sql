
create extension if not exists vector;

alter table public.profiles
  add column if not exists embedding vector(1536),
  add column if not exists embedding_text text;

create index if not exists profiles_embedding_idx
  on public.profiles using hnsw (embedding vector_cosine_ops);

create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  match_user_id uuid not null,
  event_id uuid,
  score double precision not null,
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, match_user_id, event_id)
);

alter table public.match_results enable row level security;

create policy "users read own matches"
  on public.match_results for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users insert own matches"
  on public.match_results for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users delete own matches"
  on public.match_results for delete
  to authenticated
  using (auth.uid() = user_id);
