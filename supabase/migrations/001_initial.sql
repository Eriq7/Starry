-- 001_initial.sql
--
-- Initial Starry database schema.
--
-- Tables:
--   profiles    — one row per auth.users entry; stores display name
--   nodes       — user's saved date moments (the core object)
--   apod_cache  — metadata cache for NASA APOD API responses
--   gifts       — Phase 2: gifted starry sky links
--   events      — funnel analytics; works for both anonymous and logged-in users
--
-- Storage buckets (create in Supabase Dashboard or via CLI):
--   apod   — cached/resized APOD images (apod/{date}.jpg) — public read, server write
--   cards  — generated share card images (cards/{node_id}.png) — authenticated read, server write

-- ============================================================
-- profiles
-- ============================================================
create table if not exists profiles (
  id           uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at   timestamptz default now() not null
);

-- Automatically create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- nodes
-- ============================================================
create table if not exists nodes (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references profiles(id) on delete cascade not null,
  event_date         date not null,
  resolved_apod_date date,               -- actual APOD date used (may differ for video fallback)
  note               text,
  keywords           text[],
  apod_title         text,
  apod_proxied_url   text,               -- Supabase Storage URL for the APOD image (immutable)
  apod_copyright     text,
  card_image_url     text,               -- stored generated share card image (immutable)
  is_curated         boolean default false not null,
  created_at         timestamptz default now() not null
);

create index if not exists nodes_user_id_idx on nodes(user_id);
create index if not exists nodes_event_date_idx on nodes(event_date);

-- ============================================================
-- apod_cache
-- ============================================================
create table if not exists apod_cache (
  date             date primary key,
  raw_data         jsonb not null,        -- full NASA APOD API response (+ resolved_date annotation)
  proxied_image_url text,                 -- Supabase Storage URL (immutable, set after first image proxy)
  fetched_at       timestamptz default now() not null
);

-- ============================================================
-- gifts  (Phase 2 — scaffold now)
-- ============================================================
create table if not exists gifts (
  id                 text primary key,    -- short readable ID for the URL slug
  sender_id          uuid references profiles(id) on delete set null,
  recipient_name     text,
  event_date         date not null,
  resolved_apod_date date not null,
  message            text,
  viewed_at          timestamptz,
  created_at         timestamptz default now() not null
);

-- ============================================================
-- events  (funnel analytics)
-- ============================================================
create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id    uuid references profiles(id) on delete set null,  -- null for anonymous
  session_id text,                                              -- random ID from localStorage
  metadata   jsonb,
  created_at timestamptz default now() not null
);

create index if not exists events_event_type_idx on events(event_type);
create index if not exists events_session_id_idx on events(session_id);
create index if not exists events_created_at_idx on events(created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================

-- profiles: users can only read/update their own row
alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- nodes: users can only CRUD their own nodes
alter table nodes enable row level security;
create policy "nodes_select_own" on nodes for select using (auth.uid() = user_id);
create policy "nodes_insert_own" on nodes for insert with check (auth.uid() = user_id);
create policy "nodes_update_own" on nodes for update using (auth.uid() = user_id);
create policy "nodes_delete_own" on nodes for delete using (auth.uid() = user_id);

-- apod_cache: public read (anyone can benefit from the cache), server-only write
alter table apod_cache enable row level security;
create policy "apod_cache_public_read" on apod_cache for select using (true);
-- Inserts/updates go through service role key only (no anon/user insert policy)

-- events: anyone can insert (anon and logged-in), no reads via RLS
alter table events enable row level security;
create policy "events_insert_all" on events for insert with check (true);

-- gifts: public read by ID, insert by authenticated users
alter table gifts enable row level security;
create policy "gifts_select_public" on gifts for select using (true);
create policy "gifts_insert_auth" on gifts for insert with check (auth.uid() = sender_id);
