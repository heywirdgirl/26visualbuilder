create or replace function public.clone_post(target_post_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_project_id uuid;
  source_post public.posts;
begin
  if auth.uid() is null then
    raise exception 'Cần đăng nhập trước khi clone.';
  end if;

  select *
  into source_post
  from public.posts
  where id = target_post_id
    and is_active = true;

  if source_post is null then
    raise exception 'Post không tồn tại hoặc đã bị gỡ.';
  end if;

  insert into public.projects (
    owner_id,
    name,
    description,
    tree_data,
    thumbnail_url
  )
  values (
    auth.uid(),
    source_post.name || ' (Clone)',
    source_post.description,
    source_post.tree_data,
    source_post.thumbnail_url
  )
  returning id into new_project_id;

  insert into public.clones (
    post_id,
    user_id,
    project_id
  )
  values (
    target_post_id,
    auth.uid(),
    new_project_id
  );

  update public.posts
  set clone_count = clone_count + 1
  where id = target_post_id;

  return new_project_id;
end;
$$;

revoke execute on function public.clone_post(uuid) from public;
grant execute on function public.clone_post(uuid) to authenticated;