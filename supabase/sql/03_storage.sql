-- Supabase Storage 설정 및 RLS 정책
-- 버킷명은 요구사항에 맞춰 public 이미지 버킷으로 구성

-- 버킷 생성: blog-images (public) - 존재하지 않을 때만 생성
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'blog-images') then
    perform storage.create_bucket('blog-images', public := true);
  end if;
end $$;

create policy "storage: read blog-images" on storage.objects
  for select using (bucket_id = 'blog-images');

-- 인증 사용자만 업로드 가능 (버킷 제한)
create policy "storage: insert authenticated" on storage.objects
  for insert with check (
    bucket_id = 'blog-images' and auth.role() = 'authenticated'
  );

create policy "storage: delete own" on storage.objects
  for delete using (
    bucket_id = 'blog-images' and auth.uid() = owner
  );