
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
