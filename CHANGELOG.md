# 변경 로그

## 2025-11-12 — 테스트 인프라 제거 및 백업 스냅샷

- 테스트 폴더 삭제: `blog/test/`
- 테스트 설정 삭제: `blog/vitest.config.ts`
- npm 스크립트 정리: `test`, `test:watch`, `coverage` 제거
- devDependencies 정리: `vitest`, `@vitest/coverage-v8`, `@testing-library/*`, `jsdom` 제거
- `.gitignore` 정리: `/coverage` 항목 제거
- 문서 업데이트: `REFACTORING_PLAN.md` 테스트 관련 목표/상태/스크립트 중단으로 변경
- 백업 스냅샷 생성: 레포지토리 전체 Zip 아카이브(파일명: `backup_snapshot_no-tests_YYYYMMDD_HHMM.zip`)

영향도
- 애플리케이션 실행/빌드/배포 경로에는 영향 없음
- 테스트 실행은 더 이상 지원되지 않으며, 운영자/사용자 측에서 별도 검증을 수행

검증
- 전역 검색으로 테스트 파일/설정/의존성/스크립트 잔존 여부 점검(0건)
- Dev 서버/Start 서버 기동 상태 유지, UI 기능 충돌 없음

