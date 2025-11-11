# 적용 체크리스트 (완료)

- [x] md 문서 분석 및 요구사항 요약
- [x] 스토리지 버킷명 결정: `blog-images`
- [x] 테이블 스키마 작성 (profiles, posts, comments)
- [x] 인덱스 및 제약조건 추가
- [x] RLS 정책 분리 파일로 작성
- [x] Storage 버킷 생성 SQL 작성
- [x] Storage RLS: 읽기/업로드/삭제 정책 정의
- [x] 타임스탬프/UUID 기본값 점검
- [x] Supabase 적용 가이드 문서 추가
- [x] 워크스페이스 파일 구조 생성 및 저장
- [x] 최종 검토 및 실행 단계 안내 준비
- [x] 정책 테스트 포인트 문서화

정책/스키마는 요구사항을 충족하도록 설계되어 있으며, Supabase SQL Editor에서 순서대로 실행하면 적용됩니다.

---

## 운영자 작업 체크리스트 (해야 할 일)

- [ ] Google Cloud에서 OAuth 클라이언트 생성 (Authorized redirect: `https://<REF>.supabase.co/auth/v1/callback`)
- [ ] Supabase Authentication → Providers에서 Google 활성화 및 Client ID/Secret 저장
- [ ] `.env.local` 설정 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`)
- [ ] 개발 서버 포트와 `NEXT_PUBLIC_SITE_URL` 일치 확인(예: `http://localhost:3023`)
- [ ] 브라우저 이전 세션/쿠키 정리 후 로그인 재검증
- [ ] 개인정보 처리 방침(`/privacy`)과 이용 약관(`/terms`) 최신 본문 반영
- [ ] `rss.xml`, `atom.xml`, `sitemap.xml` 생성 라우트 정상 동작 확인
- [ ] 댓글/북마크 API 라우트 권한 및 RLS 정책 점검
