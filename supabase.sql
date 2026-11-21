-- Loy Krathong ๒๕๖๙ · Online — run once in Supabase → SQL Editor
create extension if not exists pgcrypto;

create table if not exists public.krathongs (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type       text not null check (type in ('krathong','lantern')),
  name       text not null default '' check (char_length(name) <= 30),
  wish       text not null default '' check (char_length(wish) <= 140),
  cat        text not null default 'general',
  cfg        jsonb not null,
  public     boolean not null default true,
  ip_hash    text,
  reports    int not null default 0,
  hidden     boolean not null default false
);
create index if not exists krathongs_river_idx on public.krathongs (hidden, created_at desc);
create index if not exists krathongs_rate_idx  on public.krathongs (ip_hash, created_at desc);

-- No public access at all: only the Netlify functions (service key) can read/write.
alter table public.krathongs enable row level security;

create or replace function public.river_stats() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'total',   count(*) filter (where type = 'krathong'),
    'total_l', count(*) filter (where type = 'lantern'))
  from public.krathongs;
$$;

create or replace function public.report_krathong(kid uuid) returns void
language sql security definer set search_path = public as $$
  update public.krathongs set reports = reports + 1, hidden = (reports + 1) >= 3 where id = kid;
$$;

revoke all on function public.river_stats()        from public, anon, authenticated;
revoke all on function public.report_krathong(uuid) from public, anon, authenticated;
