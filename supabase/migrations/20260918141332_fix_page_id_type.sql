alter table public.post_pages alter column page_id type text;

drop function if exists public.extract_page_ids(jsonb); -- bắt buộc drop trước vì đổi return type (uuid[] -> text[])

create function public.extract_page_ids(tree jsonb)
returns text[]
language plpgsql
immutable
as $$
declare
  result text[] := array[]::text[];
  child jsonb;
begin
  if tree->>'type' = 'system.page' then
    result := array_append(result, tree->>'id');
  end if;

  for child in select * from jsonb_array_elements(coalesce(tree->'children', '[]'::jsonb))
  loop
    result := result || public.extract_page_ids(child);
  end loop;

  return result;
end;
$$;

-- publish_post() giữ nguyên signature (không đổi return type) nên create or replace được —
-- chỉ đổi bên trong: text[] thay uuid[], bỏ toàn bộ ::uuid cast.
create or replace function public.publish_post(
  target_project_id uuid,
  post_name text,
  post_slug text,
  post_description text,
  post_tree_data jsonb,
  cover_thumbnail_url text,
  page_images jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_post_id uuid;
  expected_page_ids text[];
  provided_page_ids text[];
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

  select array_agg(elem->>'page_id') into provided_page_ids
  from jsonb_array_elements(page_images) elem;

  if coalesce(array_length(provided_page_ids, 1), 0) != array_length(expected_page_ids, 1) then
    raise exception 'Số lượng ảnh không khớp số lượng Page trong project.';
  end if;

  if exists (select unnest(expected_page_ids) except select unnest(provided_page_ids)) then
    raise exception 'Thiếu ảnh cho ít nhất 1 Page — mọi Page đều phải có ảnh.';
  end if;

  if exists (select unnest(provided_page_ids) except select unnest(expected_page_ids)) then
    raise exception 'Có ảnh gắn với Page không tồn tại trong project.';
  end if;

  insert into public.posts (project_id, author_id, slug, name, description, tree_data, thumbnail_url)
  values (target_project_id, auth.uid(), post_slug, post_name, post_description, post_tree_data, cover_thumbnail_url)
  returning id into new_post_id;

  for img in select * from jsonb_array_elements(page_images)
  loop
    insert into public.post_pages (post_id, page_id, image_url)
    values (new_post_id, img->>'page_id', img->>'image_url');
  end loop;

  return new_post_id;
end;
$$;