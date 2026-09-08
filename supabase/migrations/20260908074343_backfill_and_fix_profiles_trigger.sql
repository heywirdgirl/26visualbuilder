-- Backfill: tạo profile cho MỌI user đã tồn tại trong auth.users nhưng chưa có profile
-- (tài khoản tạo TRƯỚC khi trigger ra đời — trigger không tự áp dụng ngược cho data cũ).
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Tạo lại function + trigger theo kiểu AN TOÀN chạy lại nhiều lần (đúng bài học từ lỗi
-- CI/CD "relation already exists" trước đây) — đảm bảo mọi lượt đăng ký MỚI từ giờ chắc
-- chắn có profile, kể cả nếu trigger cũ vô tình bị xoá/lỗi vì lý do nào đó.
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
  on conflict (id) do nothing; -- phòng hờ nếu vì lý do gì profile đã tồn tại trước đó
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();