-- ========================================================
-- 1. BẢNG PROFILES
-- ========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles
  for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ========================================================
-- 2. BẢNG PROJECTS
-- ========================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Project',
  description text,
  tree_data jsonb not null,
  thumbnail_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Owners can manage their projects" on public.projects;
create policy "Owners can manage their projects"
  on public.projects
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Anyone can view public projects" on public.projects;
create policy "Anyone can view public projects"
  on public.projects
  for select
  using (is_public = true);

create index if not exists projects_owner_id_idx on public.projects (owner_id);
create index if not exists projects_is_public_idx on public.projects (is_public) where is_public = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- ========================================================
-- 3. BẢNG PROJECT_LIKES
-- ========================================================
create table if not exists public.project_likes (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.project_likes enable row level security;

drop policy if exists "Anyone can view project likes" on public.project_likes;
create policy "Anyone can view project likes"
  on public.project_likes
  for select
  using (true);

drop policy if exists "Users can manage their own likes" on public.project_likes;
create policy "Users can manage their own likes"
  on public.project_likes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
