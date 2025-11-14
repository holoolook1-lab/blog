## 목표
- Report-Only로 수집한 위반 리포트를 기반으로, 중요 페이지부터 CSP를 Enforce로 전환
- nonce/hash 적용으로 inline 스크립트/스타일을 안전하게 허용하거나 제거
- Realtime(WebSocket)과 이미지/프레임 도메인 화이트리스트를 최소화하여 보안 강화

## 진행 순서(점진 적용)
### 1) 리포트 수집·요약(0–1일)
- /, /posts, /posts/[slug], /write 등 핵심 경로에서 사용 중인 기능 흐름 실행
- /api/csp-report 로그를 바탕으로 위반 지점(스크립트/스타일/외부 도메인)을 집계

### 2) 중요 페이지 Enforce 전환(1차)
- 타깃: /, /posts/[slug], /write
- 정책 변경:
  - script-src: 'self' 'nonce-<요청별-nonce>'
  - style-src: 'self' (필요 시 'nonce' 또는 'hash' 병행)
  - connect-src/img-src/frame-src: 실제 사용 도메인만 남기기(https:, wss:, Supabase host, YouTube/Vimeo 등)
- 코드 변경:
  - 이미 미들웨어에서 nonce 쿠키 발급 완료 → 페이지 내부 모든 <script>에 nonce 부여
  - inline 스타일 제거 또는 style 태그에 nonce/hash 적용
  - JSON-LD는 기존대로 nonce 유지
- 검증:
  - 브라우저 콘솔 오류 없음, Realtime(wss) 정상, 댓글 실시간 유지

### 3) 리포트 재수집·수정(2차)
- Enforce 후 남은 위반 항목(특히 style-src) 재확인
- 외부 접속 도메인 과잉 허용 여부 최소화

### 4) 전체 페이지 확대(3차)
- 나머지 경로(/posts, /privacy, /terms, /mypage 등)에서 동일 정책 적용
- Report-Only를 제거하고 단일 Enforce 정책 유지

### 5) 롤백/예외 처리
- 문제가 생기면 해당 경로만 일시적으로 Report-Only 유지
- 긴급 시 전역을 Report-Only로 되돌린 후 세부 예외 수정

## 주의/보증
- Realtime(wss) 차단되지 않도록 connect-src에 wss와 Supabase 호스트 유지
- 작성/댓글/삭제/업로드 등 권한 흐름은 기존 서버 세션 단일화로 안전
- 변경마다 핵심 흐름을 실제로 검증(댓글 실시간, 작성/삭제, 이미지 WebP 업로드)

## 필요 자료
- /api/csp-report 요약(상위 위반 지점/도메인/지시문) 공유
- 실제 페이지에서 inline 사용 지점 목록

위 계획대로 바로 진행할까요?