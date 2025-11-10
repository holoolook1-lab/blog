# Supabase SQL 적용 가이드

이 문서는 레포의 Supabase 스키마/정책/스토리지 설정을 운영 또는 로컬 프로젝트에 반영하는 절차를 안내합니다.

## 1) SQL 파일 적용 순서
- 위치: `supabase/sql`
- 순서대로 실행하세요:
  1. `01_schema.sql` (테이블/트리거 생성)
  2. `02_rls.sql` (RLS 정책 설정)
  3. `03_storage.sql` (스토리지 버킷 및 정책)

Supabase 콘솔 → SQL Editor에서 각 파일 내용을 붙여넣고 실행하면 됩니다.

## 2) 발행(Publish)된 글 공개 범위
- RLS 정책: `posts: read published or own`
  - 누구나 `published = true` 인 포스트를 읽을 수 있습니다.
  - 비발행 포스트는 작성자만 읽을 수 있습니다.
- 따라서 글 작성 후 “발행”을 누르면 로그인하지 않은 사용자도 글을 볼 수 있게 됩니다.

## 3) 스토리지 추가 설정(선택 사항)
앱에는 스토리지 버킷을 생성/업데이트하는 관리용 엔드포인트가 있습니다:
- 경로: `POST /api/storage/setup`
- 기능: 버킷 `blog-images`가 없으면 생성(public), 있으면 public 보장 및 옵션 적용
- 옵션 예:
  - `allowedMimeTypes`: `['image/webp', 'image/jpeg', 'image/png']`
  - `fileSizeLimit`: `'10MB'`

이 엔드포인트는 “서비스 롤 키(Service Role Key)”가 있어야 동작합니다. 없으면 `501 service_key_required`로 종료합니다.

### 서비스 롤 키란?
- Supabase 프로젝트의 서버용 키로, RLS를 우회하거나 관리 작업(버킷 생성/수정 등)을 수행할 때 사용합니다.
- 매우 민감한 값입니다. 브라우저/클라이언트에 노출하면 안 됩니다.

### 로컬에서 적용 방법
1. Supabase 콘솔 → Project Settings → API에서 `service_role` 키를 확인합니다.
2. 블로그 앱 루트(`blog/`)에 `.env.local` 파일을 만들고 다음을 설정합니다:
   ```
   SUPABASE_SERVICE_ROLE_KEY=서비스롤키값
   NEXT_PUBLIC_SUPABASE_URL=프로젝트URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=anon키값
   ```
   - `.env.local`는 커밋하지 마세요.
3. 개발 서버를 재시작합니다.
4. 엔드포인트를 호출합니다:
   - 브라우저/REST 클라이언트에서 `POST http://localhost:3000/api/storage/setup`
   - Windows PowerShell 예:
     ```powershell
     Invoke-WebRequest -Method Post -Uri http://localhost:3000/api/storage/setup
     ```
   - 성공 시 `{ ok: true, bucket: ... }` 응답이 옵니다.

### 운영(배포) 환경에서 적용 방법
1. 호스팅 환경(Vercel 등)에서 프로젝트 환경변수로 `SUPABASE_SERVICE_ROLE_KEY`를 서버 전용으로 설정합니다.
2. 애플리케이션 배포 후 `POST https://<배포도메인>/api/storage/setup`을 한 번 호출합니다.
3. 이후 버킷 설정은 유지되며 재호출 필요 없습니다.

## 4) 주의 사항
- 기존 스키마에 `comments.user_id` 컬럼이 없던 경우:
  - 마이그레이션이 필요할 수 있습니다. 안전하게 다음 순서로 진행하세요.
    1) `alter table public.comments add column if not exists user_id uuid references auth.users (id);`
    2) 기존 데이터에 `user_id`를 채운 뒤
    3) `alter table public.comments alter column user_id set not null;`
- 서비스 롤 키는 서버에서만 사용하세요. 프런트 코드에 절대 포함하지 마세요.

## 5) 검증 체크리스트
- 포스트 발행 후 로그아웃 상태에서도 상세 페이지가 열리는지 확인
- `blog-images` 버킷에 업로드/공개 URL 조회가 정상인지 확인
- 이미지 요청 URL에 `?width=…&quality=…&format=webp` 변환 파라미터가 붙는지 Network 탭에서 확인

이 디렉터리에는 블로그 프로젝트 요구사항(md 문서)을 바탕으로 설계한 Supabase SQL과 RLS 정책이 분리되어 있습니다.

## 파일 구성
- `sql/01_schema.sql`: 테이블 스키마 (profiles, posts, comments) 및 인덱스
- `sql/02_rls.sql`: RLS 정책 (읽기/작성/수정/삭제 권한)
- `sql/03_storage.sql`: Storage 버킷 `blog-images` 생성 및 RLS 정책

## 적용 순서 (Supabase 콘솔 → SQL Editor)
1. `01_schema.sql` 실행
2. `02_rls.sql` 실행
3. `03_storage.sql` 실행

## 설계 요약
- posts는 `user_id`로 작성자 식별, 발행된 글은 모두 읽기 가능
- 댓글은 모두 읽기, 작성/수정/삭제는 작성자만 가능
- profiles는 모두 읽기, 본인만 수정 가능
- Storage 버킷 `blog-images`는 public 읽기, 업로드는 인증 사용자만 가능
  - 허용 MIME: `image/jpeg`, `image/png`, `image/webp`
  - 최대 사이즈: 5MB (RLS에서 metadata 검사)

## 환경변수 참고
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 추가 확인
- 필요 시 `gen_random_uuid()`가 동작하지 않으면 `pgcrypto` 확장 확인
- 정책 테스트: 인증/비인증 사용자로 SELECT/INSERT/UPDATE/DELETE 시도
