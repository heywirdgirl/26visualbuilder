-- ============================================================
-- 1. post_pages — page_id KHÔNG có FK, vì nó chỉ là 1 node id nằm bên trong tree_data
--    JSON của chính post đó (không trỏ tới bảng nào cả) — đúng bản chất "page_id là dữ
--    liệu nội tại của snapshot", không phải quan hệ CSDL thông thường.
-- ============================================================
create table public.post_pages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  page_id uuid not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  unique (post_id, page_id) -- chặn 2 ảnh cùng gán cho 1 Page trong cùng 1 post
);

alter table public.post_pages enable row level security;

create policy "Post pages readable when parent post is active or owned"
  on public.post_pages for select
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_pages.post_id
        and (posts.is_active = true or posts.author_id = auth.uid())
    )
  );

-- KHÔNG tạo policy insert/update/delete — chỉ publish_post() (security definer, bên
-- dưới) ghi được vào bảng này, đúng nguyên tắc đã áp dụng cho username_redirects.

-- ============================================================
-- 2. extract_page_ids — duyệt đệ quy TOÀN BỘ cây JSON, thu thập id của mọi node
--    type = 'system.page'. Tương đương chính xác hàm collectPageNodes() phía TypeScript
--    (core/store/builder-store.ts) — cùng logic, viết lại ở tầng SQL để validate được
--    ngay trong transaction publish.
-- ============================================================
create or replace function public.extract_page_ids(tree jsonb)
returns uuid[]
language plpgsql
immutable
as $$
declare
  result uuid[] := array[]::uuid[];
  child jsonb;
begin
  if tree->>'type' = 'system.page' then
    result := array_append(result, (tree->>'id')::uuid);
  end if;

  for child in select * from jsonb_array_elements(coalesce(tree->'children', '[]'::jsonb))
  loop
    result := result || public.extract_page_ids(child);
  end loop;

  return result;
end;
$$;

-- ============================================================
-- 3. publish_post — atomic: tạo posts + toàn bộ post_pages trong 1 transaction. Validate
--    page_images khớp CHÍNH XÁC (không thiếu, không dư, không trùng) với mọi Page thật
--    có trong tree_data — đúng quyết định "số ảnh PHẢI bằng số page", ép ở tầng DB,
--    không chỉ tin tưởng UI.
-- ============================================================
create or replace function public.publish_post(
  target_project_id uuid,
  post_name text,
  post_slug text,
  post_description text,
  post_tree_data jsonb,
  cover_thumbnail_url text,
  page_images jsonb -- dạng: [{"page_id": "...", "image_url": "..."}, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_post_id uuid;
  expected_page_ids uuid[];
  provided_page_ids uuid[];
  img jsonb;
begin
  if auth.uid() is null then
    raise exception 'Cần đăng nhập trước khi đăng bài.';
  end if;

  if not exists (
    select 1 from public.projects where id = target_project_id and owner_id = auth.uid()
  ) then
    raise exception 'Project không tồn tại hoặc không thuộc về bạn.';
  end if;

  expected_page_ids := public.extract_page_ids(post_tree_data);
  if coalesce(array_length(expected_page_ids, 1), 0) = 0 then
    raise exception 'Project chưa có Page nào để đăng bài.';
  end if;

  select array_agg((elem->>'page_id')::uuid) into provided_page_ids
  from jsonb_array_elements(page_images) elem;

  if coalesce(array_length(provided_page_ids, 1), 0) != array_length(expected_page_ids, 1) then
    raise exception 'Số lượng ảnh không khớp số lượng Page trong project.';
  end if;

  if exists (
    select unnest(expected_page_ids) except select unnest(provided_page_ids)
  ) then
    raise exception 'Thiếu ảnh cho ít nhất 1 Page — mọi Page đều phải có ảnh.';
  end if;

  if exists (
    select unnest(provided_page_ids) except select unnest(expected_page_ids)
  ) then
    raise exception 'Có ảnh gắn với Page không tồn tại trong project.';
  end if;

  insert into public.posts (project_id, author_id, slug, name, description, tree_data, thumbnail_url)
  values (target_project_id, auth.uid(), post_slug, post_name, post_description, post_tree_data, cover_thumbnail_url)
  returning id into new_post_id;

  for img in select * from jsonb_array_elements(page_images)
  loop
    insert into public.post_pages (post_id, page_id, image_url)
    values (new_post_id, (img->>'page_id')::uuid, img->>'image_url');
  end loop;

  return new_post_id;
end;
$$;