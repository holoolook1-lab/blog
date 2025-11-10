-- Supabase 스키마: 프로필, 포스트, 댓글
-- 앱 코드에 맞춘 최신화 버전 (updated_at 트리거 포함)

create extension if not exists "pgcrypto";

-- profiles 테이블 (사용자 프로필)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- posts 테이블
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text unique not null,
  content text not null,
  excerpt text,
  cover_image text,
  published boolean default false,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 인덱스 (요구사항 명시)
create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_user_id on public.posts (user_id);
create index if not exists idx_posts_published on public.posts (published);
create index if not exists idx_posts_slug on public.posts (slug);

-- comments 테이블 (대댓글 1단계 지원)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 인덱스 (요구사항 명시)
create index if not exists idx_comments_post_id on public.comments (post_id);
create index if not exists idx_comments_parent_id on public.comments (parent_id);
create index if not exists idx_comments_created_at on public.comments (created_at desc);

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_posts on public.posts;
create trigger set_updated_at_posts
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_comments on public.comments;
create trigger set_updated_at_comments
before update on public.comments
for each row execute function public.set_updated_at();