# 릴리스 체크리스트 (배포 속도 최적화)

## 1) 환경변수 준비
- `NEXT_PUBLIC_SITE_URL` (예: `https://rakiraki.kr`)
- `NEXT_PUBLIC_SITE_NAME` (예: `라키라키`)
- `NEXT_PUBLIC_SITE_DESCRIPTION` (예: `일상과 생각을 기록합니다`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (옵션) `SUPABASE_SERVICE_ROLE_KEY` — 관리자 기능이 있을 경우만

## 2) 데이터베이스 준비
- Supabase 테이블/인덱스 확인: `posts.slug` 유니크, `created_at/updated_at` 인덱스
- 스토리지 버킷: `blog-images` (공개 읽기)
- 기본 데이터: 예시 포스트 1~2개, 프로필 1개

## 3) 품질 확인 (로컬)
- `npm install && npm run build` 성공
- `npm run dev`로 주요 페이지 확인
  - 홈(`/`), 목록(`/posts`), 상세(`/posts/[slug]`), 작성(`/write`), 프로필(`/profile`)
- SEO 메타 확인
  - Canonical: 상세 페이지가 `https://도메인/posts/[slug]`로 일관
  - OpenGraph/Twitter: 제목/설명/이미지 노출 확인
  - RSS(`/rss.xml`), Atom(`/atom.xml`), Sitemap(`/sitemap.xml`), Robots(`/robots.txt`)

## 4) 성능·UX 체크
- LCP 이미지에 `next/image` 사용 확인, 로딩 상태/토스트 정상
- 모바일 헤더/푸터, 공유 버튼, 댓글/스크랩 동작 확인
- 한국어 날짜/슬러그(한글 포함) 처리 확인

## 5) 보안·오류
- 이미지 업로드 허용 확장자(JPEG/PNG/WEBP), 파일 크기 제한(5MB)
- API 에러 메시지 표준화(400/500)
- 환경변수 미설정 시 폴백 동작 확인(에러 토스트/가이드 텍스트)

## 6) 배포
- Vercel에 프로젝트 연결 후 환경변수 입력
- 도메인 연결 및 `NEXT_PUBLIC_SITE_URL` 값 업데이트
- 빌드 완료 후 프로덕션에서 SEO 라우트 동작 확인

## 7) 최종 확인
- 홈/상세/작성/프로필 실사용 점검
- 메타 유틸(`getPublicSiteMeta`)이 모든 메타에 일관 적용되는지 확인
- 변경 로그(`CHANGELOG.md`) 최신화

> 빠른 일괄 완성/배포를 목표로 구성되었습니다. 이후 피드백에 따라 세부 항목을 확장하세요.

