-- 이용자 동의 기록 테이블
-- 실행 순서: 01_schema.sql, 02_rls.sql 이후 적용

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  privacy_version text not null,
  terms_version text not null,
  consented_at timestamptz not null default now(),
  ip text,
  user_agent text
);

alter table public.agreements enable row level security;

-- 본인만 조회
create policy "agreements: select self" on public.agreements
  for select using (auth.uid() = user_id);

-- 본인만 삽입
create policy "agreements: insert self" on public.agreements
  for insert with check (auth.uid() = user_id);

-- 재동의(업데이트)는 허용하지 않음: 추적을 위해 새 행 삽입만 허용

-- 인덱스: 사용자별 최신 동의 조회 성능
create index if not exists agreements_user_id_idx on public.agreements(user_id);
create index if not exists agreements_consented_at_idx on public.agreements(consented_at desc);

