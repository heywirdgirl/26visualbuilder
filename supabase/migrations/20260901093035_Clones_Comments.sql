-- ========================================================
-- Migration #3
-- Clones & Comments
--
-- Mục tiêu:
-- 1. projects trở thành private workspace hoàn toàn.
-- 2. clones ghi nhận mỗi lần user clone một post.
-- 3. comments lưu bình luận của user trên post.
-- 4. Không lưu comments.cloned.
--    Trạng thái "đã dùng project" được suy ra từ bảng clones.
-- ========================================================


-- ========================================================
-- 1. PROJECTS: bỏ trạng thái public cũ
-- ========================================================
--
-- Sau Migration #2:
--   projects = private editable workspace
--   posts    = public immutable snapshot
--
-- Vì vậy projects.is_public không còn cần thiết.
--
-- is_public không còn được sử dụng.
-- Public project đã được chuyển sang bảng posts.

drop policy if exists "Anyone can view public projects"
  on public.projects;

drop index if exists public.projects_is_public_idx;

alter table public.projects
drop column if exists is_public;


-- ========================================================
-- 2. CLONES
-- ========================================================
--
-- Mỗi lần user clone một post tạo một record.
--
-- Không dùng PRIMARY KEY (post_id, user_id)
-- vì một user có thể clone cùng một post nhiều lần
-- để tạo nhiều project khác nhau.
--

create table if not exists public.clones (
  id uuid primary key default gen_random_uuid(),

  post_id uuid not null
    references public.posts(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  project_id uuid
    references public.projects(id)
    on delete set null,

  created_at timestamptz not null default now()
);


-- ========================================================
-- Indexes
-- ========================================================

create index if not exists clones_post_id_idx
  on public.clones(post_id);

create index if not exists clones_user_id_idx
  on public.clones(user_id);

create index if not exists clones_project_id_idx
  on public.clones(project_id);


-- ========================================================
-- RLS
-- ========================================================

alter table public.clones enable row level security;


-- Người dùng có thể xem lịch sử clone.
--
-- Điều này cũng cho phép sau này query:
-- "User này đã clone post này chưa?"
--

drop policy if exists "Users can view clones"
  on public.clones;

create policy "Users can view clones"
  on public.clones
  for select
  using (true);


-- User chỉ được tạo clone record cho chính mình.
--

drop policy if exists "Users can create their own clones"
  on public.clones;

create policy "Users can create their own clones"
  on public.clones
  for insert
  with check (auth.uid() = user_id);


-- Không cho user tự ý sửa lịch sử clone.
--

drop policy if exists "Clones are immutable"
  on public.clones;

create policy "Clones are immutable"
  on public.clones
  for update
  using (false);


-- Không cho user tự xóa lịch sử clone.
--

drop policy if exists "Clones cannot be deleted"
  on public.clones;

create policy "Clones cannot be deleted"
  on public.clones
  for delete
  using (false);


-- ========================================================
-- 3. COMMENTS
-- ========================================================

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),

  post_id uuid not null
    references public.posts(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  content text not null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ========================================================
-- Indexes
-- ========================================================

create index if not exists comments_post_id_idx
  on public.comments(post_id);

create index if not exists comments_user_id_idx
  on public.comments(user_id);

create index if not exists comments_created_at_idx
  on public.comments(created_at);


-- ========================================================
-- RLS
-- ========================================================

alter table public.comments enable row level security;


-- Ai cũng có thể đọc comment.
--

drop policy if exists "Anyone can view comments"
  on public.comments;

create policy "Anyone can view comments"
  on public.comments
  for select
  using (true);


-- User chỉ được tạo comment bằng chính user_id của mình.
--

drop policy if exists "Users can create their own comments"
  on public.comments;

create policy "Users can create their own comments"
  on public.comments
  for insert
  with check (auth.uid() = user_id);


-- User chỉ được sửa comment của mình.
--

drop policy if exists "Users can update their own comments"
  on public.comments;

create policy "Users can update their own comments"
  on public.comments
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- User chỉ được xóa comment của mình.
--

drop policy if exists "Users can delete their own comments"
  on public.comments;

create policy "Users can delete their own comments"
  on public.comments
  for delete
  using (auth.uid() = user_id);


-- ========================================================
-- 4. TỰ ĐỘNG CẬP NHẬT updated_at CHO COMMENTS
-- ========================================================

drop trigger if exists set_comments_updated_at
  on public.comments;

create trigger set_comments_updated_at
  before update on public.comments
  for each row
  execute function public.set_updated_at();


-- ========================================================
-- DONE
-- ========================================================