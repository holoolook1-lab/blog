-- 교차 브라우저 승인용 일회용 로그인 이전 테이블 (충돌 방지 포함)

-- 필요한 확장 설치 (Supabase 기본 제공 환경에서도 안전)
create extension if not exists pgcrypto;

-- 테이블 생성: 존재하지 않을 때만 생성
create table if not exists login_transfers (
  id uuid default gen_random_uuid() primary key,
  code text not null,
  token_hash text,
  auth_code text,
  type text check (type in ('pkce','magiclink') ),
  email text,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

-- 유일성 제약: 승인 코드는 중복되면 안 됨
alter table login_transfers
  add constraint if not exists uq_login_transfers_code unique (code);

-- 인덱스: 조회/만료 정리 성능 향상
create index if not exists idx_login_transfers_code on login_transfers(code);
create index if not exists idx_login_transfers_expires on login_transfers(expires_at);

-- RLS 활성화 (서비스 롤은 RLS를 우회하므로 별도 정책 없이 안전)
alter table login_transfers enable row level security;

-- 선택: 만료된 코드 자동 정리를 위한 스케줄러(있다면)에서 사용할 수 있는 뷰/함수는
-- 운영 환경 정책에 맞추어 별도 파일에서 구성하세요.

