
-- ============================================================
-- 1. Chặn UPDATE trực tiếp cột username — chỉ change_username() (bên dưới) được phép,
--    thông qua 1 "cờ" tạm trong transaction (set_config), giống cách immutable Post
--    (prevent_post_content_edit) đã dùng ở Migration #2.
-- ============================================================
create or replace function public.prevent_direct_username_change()
returns trigger language plpgsql as $$
begin
  if new.username is distinct from old.username then
    if coalesce(current_setting('app.allow_username_change', true), '') <> 'true' then
      raise exception 'Không được sửa username trực tiếp — dùng function change_username().';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_username_change_via_function
  before update on public.profiles
  for each row execute function public.prevent_direct_username_change();

-- ============================================================
-- 2. change_username — validate format + reserved word + unique, ghi redirect,
--    rồi mới update — tất cả trong 1 transaction atomic.
-- ============================================================
create or replace function public.change_username(new_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized text;
  current_username text;
  reserved text[] := array[
    'projects','editor','post','posts','api','auth','profile','login','signup',
    'logout','settings','admin','about','help','support','terms','privacy',
    'static','public','assets','favicon','www','app','dashboard','home','new',
    'edit','delete','create','update','user','users','account','feed','explore',
    'search','notifications','messages','null','undefined'
  ];
begin
  if current_user_id is null then
    raise exception 'Cần đăng nhập trước khi đổi username.';
  end if;

  normalized := public.slugify_username(new_username);

  if normalized !~ '^[a-z0-9-]{3,30}$' then
    raise exception 'Username không hợp lệ — chỉ chữ thường, số, dấu gạch ngang, 3-30 ký tự.';
  end if;

  if normalized = any(reserved) then
    raise exception 'Username này không được phép sử dụng.';
  end if;

  select username into current_username from public.profiles where id = current_user_id;

  if normalized = current_username then
    return; -- không đổi gì, coi như thành công, không cần làm thêm
  end if;

  if exists (select 1 from public.profiles where username = normalized) then
    raise exception 'Username đã có người dùng.';
  end if;

  if exists (select 1 from public.username_redirects where old_username = normalized) then
    raise exception 'Username này đã từng được dùng và đang giữ chỗ redirect — không thể dùng lại.';
  end if;

  insert into public.username_redirects (user_id, old_username)
  values (current_user_id, current_username);

  perform set_config('app.allow_username_change', 'true', true); -- true = chỉ trong transaction hiện tại
  update public.profiles set username = normalized where id = current_user_id;
end;
$$;