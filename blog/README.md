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

## TODO
- 에디터 고도화(TipTap/Lexical)
- 프로필 사용자명 중복 검사 및 UX 정리
- 토스트 메시지 일관화(댓글/폼 전반)
- 공유 버튼 확장
- 이미지 최적화 파라미터/placeholder 개선

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
- 중복 구현: Supabase URL/KEY 환경변수 조회가 여러 파일(`posts/page.tsx`, `posts/[slug]/page.tsx`, `atom.xml/route.ts`, `rss.xml/route.ts`, `sitemap.ts`)에 반복됨. 다음 라운드에서 공통 유틸로 정리 예정.
- 쿠키 접근 패턴: 서버/라우트/클라이언트 각각 표준화하여 `TypeError` 계열 오류를 방지.

## 개발 진행 로그

- `PostCard`에 `variant` 도입 및 기본값을 `borderless`로 설정.
- 포스트 목록(`posts/page.tsx`)을 `borderless` 기준으로 정리하고 `gap-6` 유지.
- 스크랩(`bookmarks/page.tsx`)을 클라이언트 컴포넌트로 전환하고 `PostCard(borderless)`로 리팩토링.
- 쿠키 접근 오류(`this.context.cookies ...`) 해결: 서버/클라이언트 사용 계층 분리로 수정.
- 프리뷰 검증: `http://localhost:3000/bookmarks`와 목록 페이지에서 시각적 변경 확인.

## 다음 작업 제안

- Supabase 환경변수 접근을 공통 유틸로 통일하여 중복 제거.
- 북마크 페이지에 정렬/필터 옵션 추가(최신/제목/좋아요 수 등).
- `PostCard`에 `showExcerpt` 옵션 도입(목록/스크랩에서 요약 표시 제어).
