## 목표
- 핵심 페이지에서 시작한 CSP Enforce를 전체 경로로 확대
- 인라인 스크립트/스타일을 안전하게 제거/치환해 완전한 nonce/hash 기반으로 전환
- Supabase 권한·세션·리얼타임과 성능(ISR/페이로드/이미지)을 병행 점검

## 단계(연속 실행)
### 1) 리포트 요약 및 대상 식별
- /api/csp-report 로그를 지시문별·도메인별·페이지별로 요약(Top N)
- 인라인 `<script>`/`<style>` 또는 스타일 속성 사용 지점 목록화

### 2) 인라인 제거/치환(우선 페이지)
- 대상: /, /posts/[slug], /write
- `<script>`: 컴포넌트로 이동 또는 `nonce` 적용, 위험한 `dangerouslySetInnerHTML` 최소화
- `<style>`/스타일 속성: 클래스 기반 치환 또는 `nonce/hash` 적용
- 외부 리소스는 `integrity/crossorigin` 점검

### 3) CSP Enforce 확대(전체 페이지)
- /posts, /mypage, /privacy, /terms 등에서 `script-src 'self' 'nonce-…'`로 전환
- `connect-src/frame-src/img-src`를 실제 사용 도메인만 남기고 최소화
- 7일간 Report‑Only 병행 후 제거(예외 경로는 별도 정책)

### 4) Supabase 권한·세션·리얼타임 점검
- 비밀번호 로그인 후 서버/클라이언트 세션 동기화 재검증(새로고침·다중 탭)
- RLS: posts/comments UPDATE/DELETE는 `auth.uid() = user_id` 확인·테스트
- 댓글 Realtime: `insert/update/delete` 구독·재연결·경합 억제 로직 확인

### 5) 업로드/이미지 정책
- WebP 전용 업로드 UX: 변환 실패 시 힌트 메시지 명확화
- 공개 URL 캐시 헤더 점검, Next 이미지 최적화 재활성화 사전 검증

### 6) 성능 튜닝
- 목록 API 페이로드 축소 유지(`content` 제외), pageSize(12) 검증
- 검색(q) 성능: `title.ilike` 옵션 제공 검토
- ISR/태그 재검증 간격 트래픽 기반 재평가(60→90/120)

### 7) SDK 품질 강화(선택)
- Supabase 타입 자동 생성(CLI) 도입(현재 최소 타입→완전 타입화)
- 댓글 삽입/검증 RPC 본격 도입(폴백 제거, DB 함수 생성 후 전환)

### 8) 배포/롤백/운영
- 단계별 배포 체크리스트(핵심 경로 테스트, Realtime/업로드/신고)
- 경로 단위 롤백 스위치 유지(이슈 시 해당 경로만 Report‑Only)
- 변경 로그/운영 문서 간단 정리

## 산출물
- CSP 위반 리포트 요약 및 수정 리스트
- 페이지별 Enforce 적용 내역·무에러 검증 결과
- 권한/세션/RLS/Realtime/업로드/성능 지표 업데이트

## 요청
- 승인 시 즉시 1–3단계 착수(요약→인라인 제거/치환→전면 Enforce 확대), 문제가 생기면 즉시 경로 단위 롤백 후 수정 재적용