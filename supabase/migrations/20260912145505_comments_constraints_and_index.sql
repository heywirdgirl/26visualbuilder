
-- ============================================================
-- 1. Ràng buộc độ dài/nội dung — PRD mục 6 (1-1000 ký tự, không toàn khoảng trắng)
--    chưa được enforce ở tầng DB trước đây, chỉ có "not null".
-- ============================================================
alter table public.comments
  add constraint comments_content_length
  check (char_length(trim(content)) >= 1 and char_length(content) <= 1000);

-- ============================================================
-- 2. Index còn thiếu — PRD mục 15 liệt kê nhưng chưa tồn tại. Cần cho việc tra "user này
--    đã clone post này chưa" (badge "Used this project") chạy nhanh, tránh full scan
--    clones mỗi lần render 1 comment.
-- ============================================================
create index if not exists clones_post_user_idx on public.clones (post_id, user_id);
