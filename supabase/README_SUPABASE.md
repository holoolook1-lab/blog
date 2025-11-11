# Supabase SQL 적용 가이드

이 문서는 레포의 Supabase 스키마/정책/스토리지 설정을 운영 또는 로컬 프로젝트에 반영하는 절차를 안내합니다.

## 1) SQL 파일 적용 순서
- 위치: `supabase/sql`
- 순서대로 실행하세요:
  1. `01_schema.sql` (테이블/트리거 생성)
  2. `02_rls.sql` (RLS 정책 설정)
  3. `03_storage.sql` (스토리지 버킷 및 정책)
  4. `04_features.sql` (추천/스크랩 등 추가 기능)
  5. `05_rewards.sql` (집계 뷰/배지/레벨 및 정책)
  6. `06_profile_sync.sql` (프로필 자동 생성 트리거 및 기존 사용자 백필)

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

### 피드/사이트맵 환경변수 가드
- `rss.xml`, `atom.xml`, `sitemap.xml` 라우트는 Supabase 공개 URL/키가 없으면 최소한의 빈 피드를 반환하도록 가드되었습니다.
- 로컬에서 `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 설정하면 정상적으로 포스트 목록을 기반으로 피드/사이트맵이 생성됩니다.

## 5) 검증 체크리스트
- 포스트 발행 후 로그아웃 상태에서도 상세 페이지가 열리는지 확인
- `blog-images` 버킷에 업로드/공개 URL 조회가 정상인지 확인
- 이미지 요청 URL에 `?width=…&quality=…&format=webp` 변환 파라미터가 붙는지 Network 탭에서 확인

이 디렉터리에는 블로그 프로젝트 요구사항(md 문서)을 바탕으로 설계한 Supabase SQL과 RLS 정책이 분리되어 있습니다.

## 파일 구성
- `sql/01_schema.sql`: 테이블 스키마 (profiles, posts, comments) 및 인덱스
- `sql/02_rls.sql`: RLS 정책 (읽기/작성/수정/삭제 권한)
- `sql/03_storage.sql`: Storage 버킷 `blog-images` 생성 및 RLS 정책
 - `sql/04_features.sql`: 추천/비추천, 스크랩, 방문자 집계 및 정책
 - `sql/05_rewards.sql`: 활동 집계 뷰(`profile_stats`), 배지/레벨, 동기화 함수 및 정책
 - `sql/06_profile_sync.sql`: 프로필 자동 생성 트리거 및 기존 사용자 백필

## 적용 순서 (Supabase 콘솔 → SQL Editor)
1. `01_schema.sql` 실행
2. `02_rls.sql` 실행
3. `03_storage.sql` 실행
4. `04_features.sql` 실행
5. `05_rewards.sql` 실행
6. `06_profile_sync.sql` 실행

## 프로필 자동 생성 트리거/백필
- 목적: 새로 가입하는 사용자는 자동으로 `public.profiles`에 행이 생성되고, 기존 가입자 중 프로필이 없는 사용자도 한 번에 채웁니다.
- 적용: `06_profile_sync.sql`을 실행합니다.
  - `auth.users`에 대한 AFTER INSERT 트리거(`on_auth_user_created`)가 설치됩니다.
  - 기존 사용자 백필이 즉시 수행됩니다(`profiles`에 없는 `auth.users.id`를 삽입).
- 참고:
  - 함수는 `security definer`로 동작하며, 정책 제약 없이 안전하게 삽입되도록 구성했습니다.
  - 중복 삽입 방지를 위해 `on conflict (id) do nothing`을 사용합니다.
  - `profiles`의 `updated_at` 트리거가 이미 설정되어 있어 이후 수정 시 타임스탬프가 갱신됩니다.

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
### 트리거 함수 중복 주의
- `01_schema.sql`에서 `public.set_updated_at()` 함수를 정의하고 `profiles/posts/comments`의 `updated_at`을 자동 갱신합니다.
- `04_features.sql`는 더 이상 `public.set_updated_at()`를 재정의하지 않습니다. 동일 함수를 재사용해 `votes` 테이블 트리거만 설정합니다.
- SQL 파일을 위 순서대로 실행하면 함수 충돌 없이 정상 동작합니다.

---

## Google OAuth 설정 (Supabase + Google Cloud)

이 섹션은 Supabase의 Google Provider 활성화와 Google Cloud에서 OAuth 클라이언트를 구성하는 절차를 안내합니다.

### 1) Google Cloud 콘솔에서 OAuth 클라이언트 생성
- 메뉴: API & Services → Credentials → Create Credentials → OAuth Client ID
- 유형: Web application
- Authorized JavaScript origins:
  - 로컬 개발 도메인 (예: `http://localhost:3000` 또는 사용 포트)
  - 운영 도메인 (예: `https://example.com`)
- Authorized redirect URIs:
  - `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
  - Supabase가 Google 인증 후 이 콜백으로 복귀합니다. 앱은 `redirectTo` 파라미터로 최종 목적지(`/auth/callback`)를 지정합니다.
- 생성 후 Client ID/Secret을 복사합니다.

### 2) Supabase에서 Google Provider 활성화
- Supabase Dashboard → Authentication → Providers → Google
- Client ID / Client Secret 입력 → Save

### 3) 애플리케이션 환경변수
- `blog/.env.local`에 다음 설정을 추가:
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (또는 실제 사용하는 포트/도메인)
- 개발 서버를 재시작합니다.

### 4) 테스트 절차
- 웹에서 로그인 페이지 이동 → "Google로 계속하기" 클릭
- Google 동의 화면 → 계정 선택 → 앱으로 복귀 확인
- 복귀 시 `auth_success=login` 파라미터 확인 및 사용자 상태 반영 확인
- 브라우저 쿠키가 이전 프로젝트에서 남아 있는 경우 `refresh_token` 요청 에러가 있을 수 있으니, 사이트 데이터 삭제 후 재시도합니다.

### 5) 보안 주의
- `SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용(스토리지 셋업 등 관리 작업용).
- 브라우저/클라이언트 측 코드에 노출하지 않도록 환경변수 관리에 유의하세요.
