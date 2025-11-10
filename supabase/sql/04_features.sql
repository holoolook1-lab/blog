-- 추가 기능 스키마: 추천/비추천, 스크랩, 방문자 집계

-- votes: 포스트 추천/비추천 (-1 또는 1), 사용자당 1개만
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (post_id, user_id)
);

-- posts에 집계 컬럼 추가(선택): 좋아요/싫어요 수 저장
alter table public.posts add column if not exists like_count integer default 0;
alter table public.posts add column if not exists dislike_count integer default 0;

-- bookmarks: 사용자 스크랩
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

-- 방문자 집계: 고유 방문자와 일별 고유 방문
create table if not exists public.visitors (
  id uuid primary key,
  first_seen timestamptz default now()
);

create table if not exists public.daily_visits (
  id uuid primary key default gen_random_uuid(),
  visit_date date not null,
  visitor_id uuid not null references public.visitors (id) on delete cascade,
  created_at timestamptz default now(),
  unique (visit_date, visitor_id)
);

-- 인덱스
create index if not exists idx_votes_post on public.votes (post_id);
create index if not exists idx_votes_user on public.votes (user_id);
create index if not exists idx_bookmarks_user on public.bookmarks (user_id);
create index if not exists idx_bookmarks_post on public.bookmarks (post_id);
create index if not exists idx_daily_visits_date on public.daily_visits (visit_date);

-- RLS 활성화
alter table public.votes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.visitors enable row level security;
alter table public.daily_visits enable row level security;

-- votes 정책: 모두 읽기, 본인만 작성/수정/삭제
drop policy if exists "votes: read all" on public.votes;
create policy "votes: read all" on public.votes
  for select using (true);
drop policy if exists "votes: insert own" on public.votes;
create policy "votes: insert own" on public.votes
  for insert with check (auth.uid() = user_id);
drop policy if exists "votes: update own" on public.votes;
create policy "votes: update own" on public.votes
  for update using (auth.uid() = user_id);
drop policy if exists "votes: delete own" on public.votes;
create policy "votes: delete own" on public.votes
  for delete using (auth.uid() = user_id);

-- bookmarks 정책: 모두 읽기, 본인만 생성/삭제
drop policy if exists "bookmarks: read all" on public.bookmarks;
create policy "bookmarks: read all" on public.bookmarks
  for select using (true);
drop policy if exists "bookmarks: insert own" on public.bookmarks;
create policy "bookmarks: insert own" on public.bookmarks
  for insert with check (auth.uid() = user_id);
drop policy if exists "bookmarks: delete own" on public.bookmarks;
create policy "bookmarks: delete own" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- visitors/daily_visits 정책: 비민감 데이터로 모두 삽입 허용
drop policy if exists "visitors: read all" on public.visitors;
create policy "visitors: read all" on public.visitors
  for select using (true);
drop policy if exists "visitors: insert any" on public.visitors;
create policy "visitors: insert any" on public.visitors
  for insert with check (true);

drop policy if exists "daily_visits: read all" on public.daily_visits;
create policy "daily_visits: read all" on public.daily_visits
  for select using (true);
drop policy if exists "daily_visits: insert any" on public.daily_visits;
create policy "daily_visits: insert any" on public.daily_visits
  for insert with check (true);

-- updated_at 자동 갱신 트리거 (votes만 필요)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_votes on public.votes;
create trigger set_updated_at_votes
before update on public.votes
for each row execute function public.set_updated_at();
