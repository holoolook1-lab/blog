## 목표
- Report‑Only에서 수집한 위반을 바탕으로 CSP를 핵심 페이지부터 Enforce로 전환하고, 기존 기능(로그인/권한/댓글 리얼타임/업로드)을 안정적으로 유지
- Supabase SDK 품질(타입·RPC), 성능(ISR/페이로드/이미지), 운영(롤백/모니터링)을 단계적으로 강화

## 단계별 실행
### 1) 리포트·모니터링(0–1일)
- /, /posts, /posts/[slug], /write에서 사용 흐름 실행: 로그인/작성/댓글/업로드
- /api/csp-report 로그를 요약(지시문별/도메인별/페이지별 상위 N)
- WebSocket 연결 오류/차단 여부 점검(브라우저 콘솔/네트워크)

### 2) CSP Enforce 1차(핵심 페이지)
- 대상: /, /posts/[slug], /write
- 정책: `script-src 'self' 'nonce-<req-nonce>'` (초기는 inline 병행, 제거 대상 파악 후 삭제)
- 리소스: `connect-src/frame-src/img-src`를 실제 사용 도메인만 유지(https:, wss:, Supabase, YouTube/Vimeo 등)
- 적용: 페이지 내 모든 `<script>`에 nonce 부여(JSON‑LD 포함), 인라인은 점진 제거/치환
- 검증: 댓글 리얼타임/작성/삭제/업로드/WebSocket 정상

### 3) 인라인 제거/치환(점진)
- 인라인 `<script>/<style>` 전수 조사 → 컴포넌트/스타일 클래스로 치환 또는 `nonce/hash` 적용
- 외부 리소스는 `integrity/crossorigin` 점검

### 4) CSP Enforce 2차(전체 확대)
- /posts, /mypage, /privacy, /terms 등으로 Enforce 확대
- 7일간 Report‑Only 병행 후 제거, 예외 경로는 별도 정책

### 5) Supabase 권한/세션 일관성
- 비밀번호 로그인 후 서버/클라이언트 세션 동기화 재검증(새로고침/다중 탭)
- RLS 정책 재확인: posts/comments UPDATE/DELETE는 `auth.uid() = user_id`만 허용
- 미들웨어 환경변수 가드 경계 테스트(누락 시 graceful)

### 6) 댓글 리얼타임 최적화
- `insert/update/delete` 구독 유지, 수동 로딩 억제 타이머 검증(경합 시나리오)
- Realtime 구독 오류 처리/재구독 확인

### 7) 업로드 정책(WebP)
- 클라이언트 변환 실패 시 UI 힌트 개선(`client_convert_to_webp` 표시)
- Storage 캐시 헤더/공개 URL 전송 최적화 재점검

### 8) 성능 개선
- 목록 API 페이로드 축소(`content` 제외)·pageSize(12) 유지 검증
- 검색(q) 성능 점검 → 필요 시 `title.ilike` 우선 옵션 제공
- ISR/태그 재검증 간격 재평가(60→90/120)
- Next 이미지 최적화 재활성화 예비검증(호환 확인 후 적용)

### 9) SDK 품질 강화(선택)
- Supabase 타입 자동 생성(CLI) 도입 → 제네릭 전면 적용
- 댓글 삽입/검증 로직을 RPC로 단일화(현재 폴백 기반, 함수 생성 후 전환)

### 10) 배포/롤백/운영
- 단계별 배포 체크리스트(핵심 경로 테스트, Realtime/업로드/신고)
- 경로 단위 롤백: 이슈 시 해당 경로만 Report‑Only 유지 후 수정 재적용
- 변경 로그/간단 운영 문서 정리(개발자용)

## 산출물/검증
- CSP 위반 리포트 요약(지시문/도메인/페이지)
- 페이지별 Enforce 적용 내역 및 테스트 결과(무에러/성능/기능)
- RLS/세션/Realtime/업로드/검색/ISR 지표 업데이트

## 요청
- 승인 후 바로 1–4단계 착수(핵심 페이지 Enforce→전체 확대)
- 문제가 생기면 경로별 Report‑Only로 즉시 롤백하고 해당 지점만 수정 후 재배포