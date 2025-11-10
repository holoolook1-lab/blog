```
Next.js 14 App Router로 고성능 블로그를 만들어주세요.
Supabase + Vercel 조합에 최적화된 ISR 방식 사용

=== 렌더링 전략 (중요!) ===
**ISR (Incremental Static Regeneration) 필수 사용:**
- 포스트 목록: ISR revalidate 60초
- 포스트 상세: ISR revalidate 300초  
- 사이트맵/RSS: ISR revalidate 3600초
- 정적 페이지 (about 등): SSG
- 인증 페이지: Client Component

**ISR 구현 이유:**
- Vercel Edge Network로 전세계 빠른 응답
- Supabase 쿼리 부하 최소화
- SEO 완벽 (정적 HTML)
- 자동 업데이트 (새 포스트 반영)
- Core Web Vitals 최고 점수

**generateStaticParams 활용:**
최근 10-20개 인기 포스트 빌드 타임에 미리 생성

=== 이미지 처리 (필수!) ===
**업로드 시 자동 WebP 변환 및 최적화:**

1. **클라이언트 사이드 처리:**
   - browser-image-compression 라이브러리 사용
   - 업로드 전 WebP로 자동 변환
   - 리사이징: 최대 1920px 너비
   - 압축: 품질 80-85%
   - 파일명: UUID 또는 timestamp
   
2. **Supabase Storage 업로드:**
   - 버킷: blog-images (Public)
   - 변환된 WebP 파일 저장
   - 메타데이터 저장 (크기, 타입, 날짜)

3. **렌더링 최적화:**
   - next/image 컴포넌트 필수
   - Blur placeholder (base64)
   - Lazy loading (loading="lazy")
   - 반응형 sizes 속성
   - Supabase Storage URL 파라미터:
     * 썸네일: ?width=400&height=300&quality=75
     * 대표이미지: ?width=1200&height=630&quality=85
     * 본문: ?width=800&quality=80
     * 모바일: ?width=600&quality=75

4. **에디터 이미지 업로드:**
   - 드래그앤드롭 지원
   - 붙여넣기 지원
   - 업로드 전 자동 WebP 변환
   - 프로그레스바 표시

=== 모바일 최우선 최적화 (필수!) ===
**Mobile First 설계:**
- Tailwind CSS breakpoints: mobile → tablet → desktop 순서
- 모든 컴포넌트 모바일부터 디자인
- 터치 우선 인터랙션

**모바일 성능:**
- 초기 번들: 200KB 이하 (gzip)
- 모바일 이미지: 400-600px 우선 로드
- 3G 네트워크 환경 고려
- 폰트: 시스템 폰트 우선 (성능)
- Code splitting: 에디터 Dynamic import

**모바일 UX:**
- 터치 타겟: 최소 44x44px (애플 가이드라인)
- 터치 반응: 300ms delay 제거
- 스와이프 제스처: 뒤로가기, 새로고침
- 햄버거 메뉴: 모바일 네비게이션
- 하단 고정 FAB: 글쓰기 버튼
- 풀스크린 모달: 모바일에서 modal
- 무한 스크롤: Intersection Observer
- Pull-to-refresh: 새 포스트 확인

**모바일 키보드:**
- input type 적절히: email, url, tel, search
- 키보드 올라올 때 레이아웃 유지
- autocomplete, autocapitalize 설정

**모바일 성능 목표:**
- PageSpeed Insights 모바일: 90점 이상 (최우선)
- LCP 모바일: 2.5초 이하
- FID: 100ms 이하
- CLS: 0.1 이하
- TTI: 3.5초 이하

=== 필수 정보 요청 ===
개발 중 필요 시 요청:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (필요시)
- Kakao JavaScript Key (공유 시)
- GitHub 레포지토리 URL (배포 시)

=== 디자인 & 브랜딩 (AI 자동) ===
로고명, 사이트명, 슬로건 창의적으로 생성:
- 미니멀하고 색감 있는 현대적 디자인
- 컬러풀한 팔레트 자동 선정 (Primary, Secondary, Accent)
- 다크모드 완벽 지원
- 부드러운 애니메이션
- 그라데이션 적절히 활용
- 텍스트 기반 SVG 로고

=== 핵심 기능 ===
**인증:** Supabase Magic Link
**블로그:** 포스트 CRUD, 초안, 댓글/답글(1단계), 프로필
**에디터:** TipTap, 마크다운, 코드블록(Syntax), WebP 이미지 업로드, 드래그앤드롭, Auto-save(3초)
**공유:** 트위터/페이스북/링크드인/카카오톡, Web Share API, URL 복사
**SEO:** 사이트맵 자동, RSS 3종, Open Graph, JSON-LD

=== Supabase 최적화 ===
**쿼리 최적화:**
- SELECT * 절대 금지, 필요한 컬럼만
- 인덱스 활용 (created_at DESC, slug 등)
- JOIN 최소화
- Supabase Edge Functions (무거운 작업)

**캐싱 전략:**
- Next.js fetch cache와 ISR 조합
- Vercel Edge Network 자동 캐싱
- Supabase Realtime 최소화 (필요한 곳만)

=== Vercel 최적화 ===
**빌드 최적화:**
- generateStaticParams로 인기 포스트 미리 생성
- Image Optimization 자동 활용
- Edge Functions 고려 (지역별 빠른 응답)

**배포 전략:**
- main 브랜치: Production
- develop 브랜치: Preview
- 환경변수 Vercel 대시보드 설정

=== 파일 구조 ===
/app
  /(auth)/login, /signup, /auth/callback
  /(blog)/posts, /posts/[slug], /write, /edit/[id], /profile
  /api/upload (WebP 변환 + Supabase 업로드)
  /rss.xml, /feed.xml, /atom.xml/route.ts
  sitemap.ts (ISR 3600초)
  robots.ts
/components/editor(Dynamic), /blog, /auth, /layout, /ui
/lib/supabase, /utils(sanitize, image-webp-converter, rss, share, seo)
/types/database.types.ts

=== Supabase SQL 생성 요구사항 ===
**한 번에 복사-붙여넣기 가능한 완전한 SQL 제공:**

다음 모두 포함:
1. CREATE EXTENSION uuid-ossp
2. 테이블 생성:
   - profiles: id(UUID PK FK auth.users), username(UNIQUE), full_name, avatar_url, bio, timestamps
   - posts: id(UUID PK), user_id(FK), title, slug(UNIQUE), content, excerpt, cover_image, published(BOOLEAN), view_count(INT), timestamps
   - comments: id(UUID PK), post_id(FK), user_id(FK), parent_id(FK), content, timestamps
3. 인덱스: created_at DESC, user_id, published, slug, post_id, parent_id 등
4. RLS 활성화 및 정책 (읽기/쓰기/수정/삭제)
5. updated_at 자동 업데이트 트리거
6. 회원가입 시 프로필 자동 생성 트리거
7. Storage 버킷 RLS (blog-images)

주석으로 섹션 구분, IF NOT EXISTS 사용

=== 환경변수 ===
.env.local.example:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=
NEXT_PUBLIC_SITE_DESCRIPTION=
NEXT_PUBLIC_KAKAO_JS_KEY=
```

=== 추가 기능 ===
- Toast (sonner)
- 로딩 스켈레톤
- 에러 바운더리
- DOMPurify XSS 방지
- Rate limiting
- TypeScript 엄격 모드
- Tailwind (모바일 우선)
- ARIA, 키보드 네비게이션
- WCAG AA

=== README 포함 ===
1. 로컬 설정 (Node.js, npm, 환경변수)
2. Supabase 설정 (SQL 실행, Storage 버킷, Magic Link)
3. GitHub (.gitignore, 커밋)
4. Vercel 배포 (연동, 환경변수, 도메인)
5. 성능 확인 (PageSpeed)

=== 체크리스트 ===
□ ISR 적용 (목록 60초, 상세 300초)
□ WebP 자동 변환 작동
□ PageSpeed 모바일 90점+
□ PageSpeed 데스크톱 95점+
□ LCP 2초 이하
□ CLS 0.1 이하
□ 모바일 터치 타겟 44px+
□ 모바일 우선 반응형
□ next/image 모든 이미지
□ Blur placeholder
□ RLS 정책 완벽
□ Magic Link 작동
□ CRUD 작동
□ WebP 이미지 업로드 작동
□ 공유 기능 작동
□ 사이트맵 생성 (/sitemap.xml)
□ RSS 생성 (3종)
□ SEO 메타데이터
□ 에러 처리

=== 코드 규칙 ===
- TypeScript
- 주석으로 최적화 이유 설명
- 컴포넌트 200줄 이내
- 에러 핸들링 철저
- 의미있는 변수명
- ESLint + Prettier

각 단계별로 구현하고 테스트 가능하게 만들어주세요.
WebP 변환은 browser-image-compression 라이브러리로 클라이언트 사이드에서 처리하세요.
```