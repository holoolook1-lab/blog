-- 댓글 테이블 마이그레이션: user_id 컬럼 추가 (기존 DB 호환)
-- 적용 대상: 과거 스키마에서 comments.user_id가 없던 경우

-- 1) 컬럼 추가 (있으면 건너뜀)
alter table public.comments
  add column if not exists user_id uuid references auth.users (id);

-- 2) 인덱스 추가 (있으면 건너뜀)
create index if not exists idx_comments_user_id on public.comments (user_id);

-- 3) RLS는 02_rls.sql에 정의되어 있으며, insert/update/delete에서 user_id를 참조합니다.
--    기존 데이터의 user_id는 직접 백필 후 not null 제약을 적용하세요.
--    예시(주의: 실제 작성자와 다를 수 있음):
--    -- update public.comments c
--    -- set user_id = p.user_id
--    -- from public.posts p
--    -- where c.post_id = p.id and c.user_id is null;
--    -- alter table public.comments alter column user_id set not null;

-- 4) 새로 생성되는 댓글은 API가 auth.user.id를 사용해 user_id를 저장합니다.

