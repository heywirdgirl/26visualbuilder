create table public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  count integer not null default 0,
  primary key (user_id, usage_date)
);

alter table public.ai_usage_daily enable row level security;

create policy "Users can view their own AI usage"
  on public.ai_usage_daily for select
  using (auth.uid() = user_id);
-- Không có policy insert/update — chỉ hàm security definer dưới đây ghi được.

-- Atomic check-rồi-tăng, dùng FOR UPDATE khoá row — chặn race condition nếu user bấm
-- Generate liên tục thật nhanh (2 request cùng lúc đều "qua" được check trước khi 1 trong
-- 2 kịp tăng số đếm), cùng nguyên tắc atomic đã dùng cho clone_post()/change_username().
create or replace function public.increment_ai_usage(max_per_day integer default 20)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if auth.uid() is null then
    raise exception 'Cần đăng nhập.';
  end if;

  insert into public.ai_usage_daily (user_id, usage_date, count)
  values (auth.uid(), current_date, 0)
  on conflict (user_id, usage_date) do nothing;

  select count into current_count
  from public.ai_usage_daily
  where user_id = auth.uid() and usage_date = current_date
  for update;

  if current_count >= max_per_day then
    return false;
  end if;

  update public.ai_usage_daily
  set count = count + 1
  where user_id = auth.uid() and usage_date = current_date;

  return true;
end;
$$;