-- 프로필 자동 생성 트리거 및 기존 사용자 백필
-- 실행 순서: 01_schema.sql, 02_rls.sql 이후 적용

-- 신규 가입 사용자(auth.users)에 대한 프로필 자동 생성 함수
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- idempotent: 이미 존재하면 무시
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 트리거: auth.users에 새 행이 생기면 프로필 자동 생성
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 기존 가입 사용자 백필: profiles에 없는 사용자만 채움(한 번 실행)
insert into public.profiles (id)
select u.id
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- 참고:
-- - 함수는 security definer로 실행되며, RLS 정책의 제약 없이 안전하게 삽입됩니다.
-- - profiles 테이블에는 updated_at 트리거가 있으므로 이후 업데이트 시 갱신됩니다.
