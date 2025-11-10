-- Supabase RLS 정책 정의
-- 요구사항: 모든 사용자 읽기, 작성자만 수정/삭제 등

-- RLS 활성화
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.profiles enable row level security;

-- posts: 읽기(발행글), 본인 글 접근 허용
create policy "posts: read published or own" on public.posts
  for select using (published = true or auth.uid() = user_id);

-- posts: 작성자만 생성 가능
create policy "posts: insert if author" on public.posts
  for insert with check (auth.uid() = user_id);

-- posts: 작성자만 수정 가능
create policy "posts: update own" on public.posts
  for update using (auth.uid() = user_id);

-- posts: 작성자만 삭제 가능
create policy "posts: delete own" on public.posts
  for delete using (auth.uid() = user_id);

-- comments: 모두 읽기 가능
create policy "comments: read all" on public.comments
  for select using (true);

-- comments: 인증 사용자만 작성 (본인만)
create policy "comments: insert by author" on public.comments
  for insert with check (auth.uid() = user_id);

-- comments: 작성자만 수정
create policy "comments: update own" on public.comments
  for update using (auth.uid() = user_id);

-- comments: 작성자만 삭제
create policy "comments: delete own" on public.comments
  for delete using (auth.uid() = user_id);

-- profiles: 읽기 모두 가능
create policy "profiles: read all" on public.profiles
  for select using (true);

-- profiles: 본인만 수정
create policy "profiles: update self" on public.profiles
  for update using (auth.uid() = id);

-- profiles: 본인만 생성 (업서트 허용을 위해 필요)
create policy "profiles: insert self" on public.profiles
  for insert with check (auth.uid() = id);