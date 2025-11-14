## 현재 상태 요약
- 프레임워크: Next.js 16(App Router), React 19, TypeScript, Tailwind(PostCSS)
- 데이터/인증: Supabase(SSR/클라이언트), RLS/스토리지 정책 구성, 미들웨어로 보호 라우트/레이트리밋 적용
- SEO: 글로벌/포스트별 `metadata`, OG/Twitter 이미지 라우트, `sitemap.xml`/`robots.txt`/RSS/Atom 완비
- 퍼포먼스: 주요 페이지 ISR(홈/목록 60s, 상세 600s 등), 경로 재검증 사용. 홈 `fetch` 옵션 충돌 존재
- 이미지: 업로드 시 WebP 변환+리사이즈, 런타임은 Supabase 변환 파라미터로 최적화, `next/image` 적절 사용
- 접근성: 스킵 링크/랜드마크/`focus-visible`/ARIA 준수, 일부 시맨틱/포커스 스타일 중복 개선 여지
- 분석: 외부 분석(GA/Vercel) 미도입, 자체 방문자 집계 API/대시플레이스 존재
- i18n: 단일 한국어 로케일, `next-intl` 미사용

## 개선 목표
- 성능/캐싱 일관화 및 비용 절감
- SEO/프리뷰 안정화와 구조화 데이터 보강
- 보안 헤더/레이트리밋 강화로 운영 안전성 향상
- 접근성/UX 세부 개선으로 완성도 제고
- 분석/국제화는 선택적으로 도입 가능

## 상세 개선 항목
### 성능/캐싱
- 홈 `fetch` 충돌 해소: `src/app/page.tsx:15, 34–35`의 `cache: 'no-store'` 제거, `next: { revalidate: 60 }`만 사용
- 태그 기반 무효화 도입: 읽기 측 `fetch(..., { next: { tags: ['posts'] } })`, 쓰기 API에서 `revalidateTag('posts')`
- 인기 조회 캐싱: `unstable_cache`로 Supabase 읽기 래핑(목록/상세 공용 쿼리)
- 재검증 주기 미세 조정: 상세 300–600s, 피드/사이트맵 900–3600s 트래픽에 맞게 조정

### SEO/미리보기
- 기본 이미지 일관화: 커버 미존재 시 글로벌 OG/Twitter 라우트 확실히 참조하도록 기본값 점검(`src/app/layout.tsx`)
- 정적 정보 페이지(이용약관/개인정보) canonical 추가, 홈 구조화 데이터(Organization/WebSite) 스키마 스크립트 삽입
- RSS/Atom 필드 정돈: 게시자/저자/카테고리/갱신 시각 형식 보강

### 보안/레이트리밋
- 최소 보안 헤더 추가(`middleware.ts`): `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, 단계적 CSP
- 레이트리밋 확대: `/api/auth/*`, `/api/upload`, 투표/북마크 등 변이 라우트에 합리적 윈도우 도입
- 환경변수 점검: `KV_REST_API_URL/TOKEN`, `NEXT_PUBLIC_SITE_URL`, Supabase 키, 신고 메일/Resend 키 등 운영 필수값 재확인

### 접근성/UX
- 리스트 시맨틱 교체: `src/app/(blog)/posts/page.tsx`의 `role="list"/"listitem"`를 `ul/li`로 변경
- 포커스 스타일 통일: 컴포넌트 내 `focus:outline-none` 정리, 전역 `:focus-visible`에 수렴
- 모달 포커스 트랩 유틸 표준화: ESC/탭 루프/원포커스 복귀 일관 구현
- 키보드 숏컷 일관화: 검색 입력의 `S`/`/` 포커스 힌트와 실제 핸들러 동기화
- 다크 모드(선택): `prefers-color-scheme` 대응으로 대비 선호 사용자 배려

### 이미지 전략
- 목록/상세 `sizes` 프리셋 일관화: 목록 `~768px`, 상세 `~1024–1280px` 중심
- `placeholder="blur"`는 LCP 후보 위주 사용, 나머지는 기본 레이지
- 업로드 제한/품질 정책 유지(품질 82, 최대 2048px), 썸네일 생성 규칙 통일

### 콘텐츠/에디터
- `sanitizeHtml` 허용 태그/속성 화이트리스트 재검토(보안·표현력 균형)
- 발췌/미디어 임베드 규칙 통일: 영상 썸네일/캡션 처리 일관 개선
- 선택: Markdown 입력 지원 레이어(현재 HTML 단일이지만 사용자 선호 케이스 고려)

### 분석(선택 도입)
- GA4 또는 Vercel Analytics 도입: `src/app/layout.tsx`에 최소 스크립트 삽입, 개인정보 처리방침 갱신
- 자체 집계와 병행 시 중복·오차 처리 로직 정리

### 국제화(선택 도입)
- `next-intl` 기반 `[locale]` 라우팅과 `NextIntlClientProvider`
- 한국어 하드코딩 문구를 메시지 키로 치환, SEO 로케일/alternates 보강

## 실행 단계
1) 빠른 개선(저위험)
- 홈 `fetch` 옵션 정리, 보안 헤더 기본값 추가, 리스트 시맨틱 교체, LCP 후보만 `priority` 유지
2) 캐싱/무효화 정교화
- 태그 기반 무효화/`unstable_cache` 도입, 재검증 주기 조정
3) SEO/콘텐츠 품질
- 구조화 데이터/Canonical/피드 필드 보강, `sanitizeHtml` 정책 재정비
4) 선택 기능
- Analytics 도입, next-intl 국제화, 다크 모드

## 검증 계획
- Lighthouse/웹 바이탈(Performance/SEO/Accessibility)
- OG/Twitter 카드 미리보기 확인(커버 유무 케이스)
- `/sitemap.xml`, `/robots.txt`, RSS/Atom 응답 검사
- 캐시/무효화 동작 점검(ISR+태그)

## 파일 변경 포인트(예시)
- `src/app/page.tsx:15, 34–35` — `fetch` 옵션 정리
- `middleware.ts` — 보안 헤더/레이트리밋 확대
- `src/app/(blog)/posts/page.tsx` — 리스트 시맨틱
- `src/app/layout.tsx` — 메타 기본값/구조화 데이터/분석 스크립트(선택)
- `src/lib/utils/image.ts` — `sizes`/프리셋 일관화
- `src/lib/utils/sanitize.ts` — 허용 규칙 조정

## 전제/리스크
- 운영 도메인/`NEXT_PUBLIC_SITE_URL` 정확 설정 필요(메타/콜백/사이트맵)
- KV/Supabase/메일 키 누락 시 일부 기능 비활성 또는 오류 가능
- CSP 도입은 외부 SDK/이미지/임베드 도메인 화이트리스트 작업 동반

승인되면 위 단계에 따라 바로 구현에 착수해 각 항목을 수행·검증하겠습니다.