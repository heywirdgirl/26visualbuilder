-- ============================================================
-- 1. username_redirects — tạo trước vì generate_unique_username()
--    cần tham chiếu bảng này khi kiểm tra va chạm.
-- ============================================================
create table public.username_redirects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  old_username text not null unique,
  created_at timestamptz not null default now()
);

alter table public.username_redirects enable row level security;

create policy "Username redirects are publicly readable"
  on public.username_redirects for select
  using (true);

-- KHÔNG tạo policy insert/update/delete — chặn hoàn toàn ghi từ client. Chỉ hàm
-- change_username() (Phase 2, security definer) mới ghi được vào bảng này.

-- ============================================================
-- 2. slugify_username — chuẩn hoá chuỗi bất kỳ về đúng format
--    lowercase, chỉ [a-z0-9-], không khoảng trắng.
-- ============================================================
create or replace function public.slugify_username(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(lower(trim(coalesce(input, ''))), '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)', '', 'g'
  );
$$;

-- ============================================================
-- 3. generate_unique_username — thử tên gốc, va chạm thì thêm hậu tố
--    số tăng dần, cực hiếm mới rơi vào fallback hash ngẫu nhiên.
-- ============================================================
create or replace function public.generate_unique_username(base_name text)
returns text
language plpgsql
as $$
declare
  base text;
  candidate text;
  attempt int := 0;
  suffix text;
  reserved text[] := array[
    'projects','editor','post','posts','api','auth','profile','login','signup',
    'logout','settings','admin','about','help','support','terms','privacy',
    'static','public','assets','favicon','www','app','dashboard','home','new',
    'edit','delete','create','update','user','users','account','feed','explore',
    'search','notifications','messages','null','undefined'
  ];
begin
  base := public.slugify_username(base_name);

  if length(base) < 3 then
    base := 'user'; -- fallback khi tên gốc quá ngắn/rỗng (VD Google không trả full_name)
  end if;

  if length(base) > 26 then -- chừa chỗ cho hậu tố "-123456" (tối đa 30 ký tự)
    base := substring(base from 1 for 26);
  end if;

  candidate := base;

  loop
    exit when
      not exists (select 1 from public.profiles where username = candidate)
      and not (candidate = any(reserved))
      and not exists (select 1 from public.username_redirects where old_username = candidate);

    attempt := attempt + 1;
    if attempt > 20 then
      suffix := substring(md5(random()::text) from 1 for 6); -- gần như không thể tiếp tục va chạm
    else
      suffix := attempt::text;
    end if;

    candidate := substring(base from 1 for 30 - length(suffix) - 1) || '-' || suffix;
  end loop;

  return candidate;
end;
$$;

-- ============================================================
-- 4. Backfill — điền username cho profile đã tồn tại (VD tài khoản test)
-- ============================================================
do $$
declare
  r record;
begin
  for r in select id, display_name from public.profiles where username is null loop
    update public.profiles
    set username = public.generate_unique_username(r.display_name)
    where id = r.id;
  end loop;
end $$;

-- ============================================================
-- 5. Ràng buộc bắt buộc + đúng format (PRD: 3-30 ký tự, chỉ [a-z0-9-])
--    Đặt SAU backfill để không lỗi vì dữ liệu cũ chưa có username.
-- ============================================================
alter table public.profiles
  alter column username set not null;

alter table public.profiles
  add constraint username_format check (username ~ '^[a-z0-9-]{3,30}$');

-- ============================================================
-- 6. Cập nhật trigger — mọi user MỚI từ giờ tự có username ngay lúc đăng ký
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_username text;
begin
  new_username := public.generate_unique_username(new.raw_user_meta_data->>'full_name');

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    new_username,
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