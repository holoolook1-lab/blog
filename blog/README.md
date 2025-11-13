# 블로그 프로젝트 (Next.js + Supabase)

## 시작하기
- `.env.local.example`을 복사하여 `.env.local` 생성 후 값 입력
- 개발 서버 실행: `npm run dev`

## 주요 기능
- 글로벌 헤더 내비게이션: `포스트`, `작성(로그인 필요)`, `프로필`, `로그인/로그아웃`
- 로그인(이메일·비밀번호) UX: 이메일 검증, 로딩/토스트, `redirect` 지원
- 글 상세: 저자에게만 `편집` 링크, 발행 상태 배지(공개/비공개)
- 글 편집: 제목/슬러그/커버/콘텐츠/발행 토글, 저장 후 상세로 이동
- 글 작성: 자동 임시저장(localStorage), 작성 성공 후 상세로 이동
  - 슬러그 검증/중복 확인 및 제출 중 상태/토스트 피드백
- 프로필 설정: 사용자명/아바타 URL 수정(본인만)
  - 닉네임 검증(영문/숫자/_/-, 2~24자) 및 중복 방지
  - 아바타 파일 업로드 지원(JPEG/PNG/WEBP, 최대 5MB)
- 이미지 업로드 API (`/api/upload`) — 버킷 `blog-images`
- RSS/Feed/Atom/Robots/Sitemap 라우트

## 최근 변경(UX 개선)
- 404 Not Found 전용 페이지 추가 및 상세 페이지에서도 미존재 글은 404로 이동
- 포스트 목록 빈 상태 메시지 및 작성 링크 제공
- 댓글 섹션 로그인 유도 메시지(비로그인 사용자를 위한 안내)
- 공유 버튼 확장: 네이티브 공유(Web Share API) 및 카카오톡(옵셔널, SDK 초기화 필요)
- 토스트 접근성 개선: `aria-live`/`role` 적용으로 스크린리더 친화적
- 헤더 개선: 현재 경로 활성 링크 하이라이트, 모바일 메뉴 토글
- 포스트 목록 페이지네이션(`?page=`) 및 이전/다음 링크
- 작성 페이지: 임시저장 초안 복원 배너(복원/무시 선택), 자동저장 상태 표시

## 라우트
- `GET /posts` 포스트 목록
- `GET /posts/[slug]` 포스트 상세(저자에게만 편집)
- `GET /write` 글 작성(로그인 필요)
- `GET /edit/[slug]` 글 편집(저자만 접근)
- `GET /profile` 프로필 설정(로그인 필요)
- `GET /login?redirect=/path` 로그인 후 리다이렉트 경로 지원
- `GET /auth/callback?redirect=/path` 이메일 확인/코드 교환 콜백

## API
- `POST /api/posts` 새 글 작성
- `PUT /api/posts/[id]` 글 수정(저자만)
- `DELETE /api/posts/[id]` 글 삭제(저자만)
- `POST /api/comments` 댓글 작성(인증 사용자)
- `PUT /api/comments/[id]` 댓글 수정(작성자)
- `DELETE /api/comments/[id]` 댓글 삭제(작성자)
- `GET /api/comments/list/[postId]` 댓글 목록
- `POST /api/upload` 이미지 업로드(인증 사용자)

## 환경변수
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SITE_DESCRIPTION`

### 로컬 개발: 하드코딩 폴백(보안 무시)
로컬에서 환경변수 없이 바로 실행하려면 하드코딩 폴백을 사용할 수 있습니다. 다음 파일에 프로젝트 값을 직접 채워 넣으세요:

- 파일: `src/lib/supabase/hardcoded.ts`

```ts
export const HARDCODED_SUPABASE_URL = 'https://xxxx.supabase.co';
export const HARDCODED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

애플리케이션은 환경변수가 없을 때 위 상수를 자동으로 사용합니다. 배포 시에는 반드시 상수를 비워두고 환경변수를 사용하세요.

## Google 로그인 설정 가이드 (Next.js + Supabase)

이 프로젝트는 Supabase OAuth와 Next.js App Router를 사용해 Google 로그인을 지원합니다. 아래 단계를 순서대로 진행하세요.

1) Google Cloud에서 OAuth 클라이언트 생성
- Google Cloud Console → API & Services → Credentials → Create Credentials → OAuth Client ID
- Application type: Web application
- Authorized JavaScript origins: 로컬 개발(`http://localhost:3000` 또는 실제 사용 포트) 및 운영 도메인 추가
- Authorized redirect URIs: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
  - Supabase가 Google 인증을 처리한 후, 앱에서 지정한 `redirectTo`(예: `/auth/callback`)로 다시 리다이렉트합니다.
- 생성된 Client ID/Secret을 보관합니다.

2) Supabase Auth에 Google Provider 설정
- Supabase Dashboard → Authentication → Providers → Google 활성화
- Client ID / Client Secret 입력 후 저장

3) 앱 환경변수 설정
- `blog/.env.local`에 다음 값을 설정합니다.
  - `NEXT_PUBLIC_SUPABASE_URL` = Supabase 프로젝트 URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon 키
  - `NEXT_PUBLIC_SITE_URL` = 로컬 개발 사이트 주소(예: `http://localhost:3023`) 또는 운영 도메인
- 개발 서버를 재시작합니다.

4) 코드 경로 및 동작
- 로그인 페이지: `src/app/(auth)/login/page.tsx`
  - `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
  - `redirectTo`는 `${NEXT_PUBLIC_SITE_URL}/auth/callback?flow=login&redirect=...` 형태로 구성
- 콜백 라우트: `src/app/auth/callback/route.ts`
  - `createServerClient(projectUrl, anonKey, { cookies })`로 세션 교환 처리
  - 환경변수가 누락된 경우 `missing_supabase_env`로 안전 리다이렉트
- 비밀번호 로그인: `src/app/(auth)/login/actions.ts` 및 `src/app/(auth)/signup/actions.ts`
  - `/api/auth/session`에서 서버 세션 토큰을 받아 클라이언트 `supabase.auth.setSession`로 동기화

5) 검증 체크리스트
다음 항목을 배포 직후 확인하세요.

- 라우팅/페이지
  - `/`, `/posts`, `/posts/[slug]`, `/bookmarks`, `/profile`, `/_not-found` 접근 가능
  - 정적 라우트: `rss.xml`, `atom.xml`, `sitemap.xml`, `robots.txt` 정상 생성/응답
- 이미지/메타
  - Supabase Storage(`public`)의 이미지 최적화/블러 플레이스홀더 동작
  - 포스트 OG/Twitter 이미지 라우트 응답(`opengraph-image-...`, `twitter-image-...`)
- 인증/권한
  - Google/OAuth 로그인 후 `/auth/callback` 복귀 및 세션 반영
  - 이메일/비밀번호 로그인·회원가입 에러/로딩 피드백 정상
  - 본인 글만 `edit/[slug]` 접근 가능, 비로그인 상태에서 보호 라우트 접근 차단
- API 정상 동작
  - `/api/posts`, `/api/comments`, `/api/bookmarks`, `/api/votes` 2xx 응답 및 에러 처리
  - `/api/upload` 업로드 제한(파일 확장자/크기) 및 실패 시 토스트/메시지 반영
- 환경변수/설정
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` 프로덕션 값 확인
  - 빌드 로그에 설정 경고 없음(`outputFileTracingRoot` ↔ `turbopack.root` 통일)
- 접근성/UX
  - 토스트 `aria-live`/`role` 적용, 포커스 트랩/키보드 내비게이션 확인
  - 빈 상태/에러 메시지 문구/버튼 동작 일관성

문제가 있으면 Vercel 빌드 로그와 콘솔 오류를 첨부해 이슈를 생성하세요.

6) 주의 사항
- 로컬 포트가 기본 3000이 아닌 경우(`3023` 등), `NEXT_PUBLIC_SITE_URL`을 해당 포트로 맞춰야 Google 로그인 콜백이 정상 복귀합니다.
- 브라우저에 이전 프로젝트의 세션/쿠키가 남아 있으면 `refresh_token` 요청 에러가 발생할 수 있습니다. 사이트 데이터 삭제 후 재시도하세요.

## 운영자 체크리스트 (해야 할 일)

- [ ] Supabase SQL 적용: `supabase/sql` 내 01~06 파일을 순서대로 실행
- [ ] 스토리지 버킷 `blog-images` 생성 및 RLS 적용(필요 시 `/api/storage/setup` 호출)
- [ ] Google OAuth: Google Cloud에서 OAuth 클라이언트 생성 및 Supabase Provider 활성화
- [ ] `.env.local` 구성: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
- [ ] 서비스 롤 키(선택): 서버에서만 사용, 운영 배포 환경변수로 설정
- [ ] 정책/문서 최신화: 개인정보 처리 방침/이용 약관 텍스트 및 버전 관리
- [ ] 기본 페이지/피드 확인: `/login`, `/signup`, `/privacy`, `/terms`, `rss.xml`, `atom.xml`, `sitemap.xml`
- [ ] 댓글/북마크/좋아요 등 핵심 기능 점검 및 토스트 메시지 일관성 확인

## TODO (상태 업데이트)
- [x] 에디터 고도화 — TipTap 도입 완료 (Lexical 전환은 선택)
- [x] 프로필 사용자명 중복 검사 및 UX 정리 — 중복 확인/검증/피드백 적용
- [x] 토스트 메시지 일관화 — `ActionToast` 공용 컴포넌트로 댓글/폼 등 적용
- [x] 공유 버튼 확장 — Web Share API + 카카오톡(옵션, `NEXT_PUBLIC_KAKAO_JS_KEY` 필요)
- [x] 이미지 최적화 파라미터/placeholder 개선 — Supabase 변환 파라미터 + Blur Placeholder 적용

## 아키텍처 및 컨벤션 업데이트

- Supabase 사용 계층 분리
  - 서버 컴포넌트: `@/lib/supabase/server`의 `getServerSupabase()` 사용 및 `next/headers`의 `cookies` 함수 레퍼런스를 직접 전달.
  - 라우트 핸들러(API): `@supabase/auth-helpers-nextjs`의 `createRouteHandlerClient({ cookies })` 사용.
  - 클라이언트 컴포넌트: `@/lib/supabase/client`의 `supabase` 인스턴스 사용.
  - 의도: Next.js App Router 환경에서 쿠키 어댑터 오류를 방지하고 인증 컨텍스트를 일관되게 유지.

- UI 컨벤션
  - `PostCard` 컴포넌트에 `variant`(`'borderless' | 'card'`) 도입, 기본값은 `'borderless'`.
  - 목록 페이지(`posts/page.tsx`)는 `borderless` 레이아웃과 `gap-6` 간격을 유지.
  - 스크랩 페이지(`bookmarks/page.tsx`)도 `PostCard(borderless)`로 통일해 시각적 일관성 강화.

## 품질 점검 결과(최근 라운드)

- Dead code: 표준 검색 기준에서 발견되지 않음.
- import/export: 주요 페이지와 라우트 핸들러의 모듈 의존성이 정상 동작.
- Supabase 환경변수 접근: `createPublicSupabaseClient()` 유틸로 통일(피드/사이트맵/목록/상세 모두 적용).
- 쿠키 접근 패턴: 서버/라우트/클라이언트 각각 표준화하여 `TypeError` 계열 오류를 방지.

## 개발 진행 로그

- `PostCard`에 `variant` 도입 및 기본값을 `borderless`로 설정.
- 포스트 목록(`posts/page.tsx`)을 `borderless` 기준으로 정리하고 `gap-6` 유지.
- 스크랩(`bookmarks/page.tsx`)을 클라이언트 컴포넌트로 전환하고 `PostCard(borderless)`로 리팩토링.
- 쿠키 접근 오류(`this.context.cookies ...`) 해결: 서버/클라이언트 사용 계층 분리로 수정.
- 프리뷰 검증: `http://localhost:3000/bookmarks`와 목록 페이지에서 시각적 변경 확인.

## 다음 작업 제안

- [x] Supabase 환경변수 접근 공통 유틸 통일 — `createPublicSupabaseClient()` 적용 완료.
- [x] `PostCard`에 `showExcerpt` 옵션 — 도입 완료(목록/스크랩에서 요약 표시 제어).
- [ ] 북마크 페이지 필터 옵션 추가 — 정렬은 완료(`최신/오래된/제목`), 필터(카테고리 등)는 추후.
