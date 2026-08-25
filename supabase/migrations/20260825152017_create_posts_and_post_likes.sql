-- Migration #2: chuyển "publish" từ cờ is_public trong projects (riêng tư, sửa được)
-- sang bảng posts riêng (công khai, bất biến sau khi đăng) — đúng kiến trúc đã chốt:
-- editor/projects là private workspace, posts là social feed, publish là hành động 1 lần.

drop table if exists public.project_likes;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  tree_data jsonb not null,
  thumbnail_url text,
  clone_count integer not null default 0,
  is_active boolean not null default true,
  published_at timestamptz not null default now(),
  unique (author_id, slug)
);

alter table public.posts enable row level security;

create policy "Posts are publicly readable when active, or by their author"
  on public.posts
  for select
  using (is_active = true or author_id = auth.uid());

create policy "Users can publish only their own projects"
  on public.posts
  for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.projects where id = project_id and owner_id = auth.uid())
  );

create policy "Authors can update their own posts"
  on public.posts
  for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Chặn sửa nội dung/slug ở TẦNG DATABASE — độc lập với UI, đúng bản chất "publish 1 lần".
create function public.prevent_post_content_edit()
returns trigger language plpgsql as $$
begin
  if new.tree_data is distinct from old.tree_data or new.slug is distinct from old.slug then
    raise exception 'Không thể sửa nội dung/slug của post đã xuất bản — chỉ được đổi is_active.';
  end if;
  return new;
end;
$$;

create trigger enforce_post_immutability
  before update on public.posts
  for each row execute function public.prevent_post_content_edit();

create index posts_author_id_idx on public.posts (author_id);
create index posts_is_active_idx on public.posts (is_active) where is_active = true;

-- Tăng clone_count atomic — tránh mất lượt đếm khi 2 người clone cùng lúc.
create function public.increment_clone_count(post_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.posts set clone_count = clone_count + 1 where id = post_id;
$$;

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "Anyone can view post likes"
  on public.post_likes for select using (true);

create policy "Users can manage their own post likes"
  on public.post_likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);