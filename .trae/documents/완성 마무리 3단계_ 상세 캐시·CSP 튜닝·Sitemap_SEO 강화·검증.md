## 목표
- 상세 페이지까지 태그 캐싱을 완성하고, CSP를 임베드 도메인에 맞춰 정확히 튜닝
- 정적 페이지를 사이트맵에 포함, 포스트 구조화 데이터를 보강
- 접근성·운영 검증 항목을 마무리해 ‘완성형’ 품질로 고정

## 구현 항목
### 상세 캐싱/무효화 정교화
- 새 헬퍼 추가: `src/lib/cache/posts.ts`
  - `getPostBySlugCached(slug)` → `unstable_cache(..., [\`post:${slug}\`], { revalidate: 600, tags: [\`post:${slug}\`] })`
- 상세 페이지 치환
  - `src/app/(blog)/posts/[slug]/page.tsx`의 Supabase 직접 조회 → `getPostBySlugCached(slug)` 사용
- API 변이 시 단건 태그 이미 추가됨(확인 완료) → 상세 캐시 반영 검증만 수행

### CSP 튜닝(임베드/이미지/연결)
- `next.config.ts`의 `headers()`에서 `Content-Security-Policy` 값 보강
  - `img-src`: `self https: data: i.ytimg.com <Supabase 호스트>`
  - `frame-src`: `https://www.youtube.com https://player.vimeo.com https://www.dailymotion.com https://player.twitch.tv https://tv.naver.com https://www.instagram.com https://www.tiktok.com https://www.facebook.com`
  - `connect-src`: `self https: <Supabase 호스트> <KV REST API>`
  - 추후 nonce/hash 기반으로 `script-src`에서 `'unsafe-inline'` 제거(단계적)
- 미들웨어의 최소 보안 헤더는 유지, CSP는 `next.config.ts`로 일원화

### Sitemap/SEO 강화
- `src/app/sitemap.ts`에 정적 페이지 포함: `/terms`, `/privacy`
- 포스트 JSON‑LD 보강(`src/app/(blog)/posts/[slug]/page.tsx`)
  - `author`, `publisher.logo`, `headline` 고정, `image` 유무 분기 유지
- 홈 JSON‑LD에 `BreadcrumbList`(선택) 추가

### 접근성 미세 조정
- 포커스 스타일 중복 제거(`focus:outline-none` 정리) 및 전역 `:focus-visible` 유지
- 스킵 링크 타깃 확인 및 각 주요 페이지 `main`/`h1` 일관성 재검증

### 운영/검증
- Lighthouse(Perf/SEO/a11y/Best Practices) 측정 및 리포트
- 변이 후 태그 캐시 갱신 확인(홈/목록/상세/피드)
- CSP 차단 로그 확인(브라우저 콘솔) 및 필요한 도메인 화이트리스트 보강

## 변경 파일
- `src/lib/cache/posts.ts`(상세 캐시 함수 추가)
- `src/app/(blog)/posts/[slug]/page.tsx`(헬퍼로 치환)
- `next.config.ts`(CSP 도메인 튜닝)
- `src/app/sitemap.ts`(정적 페이지 포함)
- `src/app/(blog)/posts/[slug]/page.tsx`(JSON‑LD 확장)
- 일부 컴포넌트의 포커스 클래스 정리

## 전제/주의
- CSP는 임베드/이미지/연결 도메인의 정확한 화이트리스트가 필요(운영 도메인 확인 후 튜닝)
- `NEXT_PUBLIC_SUPABASE_URL`과 KV REST API가 존재해야 `connect-src` 반영 가능
- React/Next의 인라인 스크립트(JSON‑LD 등)가 있어 초기에는 `'unsafe-inline'` 유지, 추후 nonce 도입

승인되면 위 항목을 즉시 구현하고 Lighthouse 리포트와 함께 결과를 전달하겠습니다.