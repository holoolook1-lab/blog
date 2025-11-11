-- 보상/레벨 시스템 SQL (profile_stats 뷰, 배지 테이블/정책, 동기화 함수)
-- Supabase SQL Editor에서 실행하여 적용하세요.

-- ===========================================
-- 집계용 인덱스 (조회 속도 최적화)
-- ===========================================
create index if not exists idx_posts_user_id on public.posts (user_id);
create index if not exists idx_posts_published on public.posts (published);
create index if not exists idx_posts_user_published on public.posts (user_id, published);

-- ===========================================
-- 사용자 활동 집계 뷰: profile_stats
-- - post_count: 공개글 수
-- - like_sum: 공개글들의 추천합
-- - score: post_count*5 + like_sum*2
-- - level: score 기반 bronze/silver/gold/platinum
-- - username, avatar_url, bio 포함(클라이언트 조회 단순화)
-- ===========================================
create or replace view public.profile_stats as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  p.bio,
  coalesce(pc.post_count, 0) as post_count,
  coalesce(pc.like_sum, 0) as like_sum,
  -- 점수 공식: 글 수에 추천의 2배 가중치 (글:2, 추천:1의 2배 관계)
  (coalesce(pc.post_count, 0) * 2 + coalesce(pc.like_sum, 0) * 1) as score,
  case
    when (coalesce(pc.post_count, 0) * 2 + coalesce(pc.like_sum, 0) * 1) >= 1000 then 'platinum'
    when (coalesce(pc.post_count, 0) * 2 + coalesce(pc.like_sum, 0) * 1) >= 500 then 'gold'
    when (coalesce(pc.post_count, 0) * 2 + coalesce(pc.like_sum, 0) * 1) >= 100 then 'silver'
    else 'bronze'
  end as level
from public.profiles p
left join (
  select
    user_id,
    count(*) filter (where published = true) as post_count,
    sum(coalesce(like_count, 0)) filter (where published = true) as like_sum
  from public.posts
  group by user_id
) pc on pc.user_id = p.id;

-- ===========================================
-- RLS 정책(읽기) — 뷰는 기저 테이블 RLS를 따릅니다.
-- profiles/posts에 공개 읽기 정책이 없을 경우 생성합니다.
-- ===========================================
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles: read all'
  ) then
    execute 'create policy "profiles: read all" on public.profiles for select using (true)';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'posts' and policyname = 'posts: read published or own'
  ) then
    execute 'create policy "posts: read published or own" on public.posts for select using (published = true or auth.uid() = user_id)';
  end if;
end $$;

-- ===========================================
-- 배지 테이블(선택): 레벨 기반 특수 배지 관리
-- ===========================================
create table if not exists public.badges (
  key text primary key,
  name text not null,
  icon text,
  min_level text,
  min_score integer default 0
);

create table if not exists public.profile_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_key text not null references public.badges (key) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, badge_key)
);

drop policy if exists "badges: read all" on public.badges;
create policy "badges: read all" on public.badges
  for select using (true);

drop policy if exists "profile_badges: read all" on public.profile_badges;
create policy "profile_badges: read all" on public.profile_badges
  for select using (true);

drop policy if exists "profile_badges: insert own" on public.profile_badges;
create policy "profile_badges: insert own" on public.profile_badges
  for insert with check (auth.uid() = user_id);

drop policy if exists "profile_badges: delete own" on public.profile_badges;
create policy "profile_badges: delete own" on public.profile_badges
  for delete using (auth.uid() = user_id);

insert into public.badges(key, name, icon, min_level, min_score)
values
  ('silver', '실버', 'medal', 'silver', 100),
  ('gold', '골드', 'crown', 'gold', 500),
  ('platinum', '플래티넘', 'diamond', 'platinum', 1000)
on conflict (key) do nothing;

-- ===========================================
-- 배지 동기화 함수(선택): 현재 레벨 기준으로 기본 배지 부여
-- 필요 시 수동 호출: select public.sync_level_badges();
-- ===========================================
create or replace function public.sync_level_badges()
returns void
language plpgsql
as $$
begin
  insert into public.profile_badges(user_id, badge_key)
  select ps.user_id,
         case
           when ps.level = 'platinum' then 'platinum'
           when ps.level = 'gold' then 'gold'
           when ps.level = 'silver' then 'silver'
           else null
         end as badge_key
  from public.profile_stats ps
  where (case
           when ps.level = 'platinum' then 'platinum'
           when ps.level = 'gold' then 'gold'
           when ps.level = 'silver' then 'silver'
           else null
         end) is not null
  on conflict (user_id, badge_key) do nothing;
end $$;
