## 목표
- 영어 로케일(`en`)과 관련된 라우팅, 메시지, 스위처, 메타데이터를 전면 제거하고, 한국어(`ko`)만 사용하는 깨끗한 구성으로 정리합니다.

## 핵심 변경 사항
1. 국제화 설정 축소
- `next-intl.config.ts|mjs`: `locales`를 `['ko']`로, `defaultLocale`는 `ko`로 유지
- `src/i18n/config.ts`: `locales = ['ko']`, `defaultLocale = 'ko'`
- `src/i18n/getLocale.ts`: 쿠키 검사 로직을 단순화하거나 항상 `'ko'` 반환
- `src/i18n/messages.ts`: `ko.json`만 로드하도록 수정

2. 로케일 라우팅/미들웨어 정리
- `middleware.ts`
  - `/en` 또는 `/ko` 세그먼트 리라이트/쿠키 설정 로직 제거
  - `config.matcher`에서 로케일 세그먼트 매칭 제거(보호/API 경로만 남김)

3. 레이아웃/메타데이터 정리
- `src/app/layout.tsx` 메타데이터 `alternates.languages`에서 `en` 제거(필요 시 전체 `languages` 항목 삭제)
- `src/app/(blog)/posts/[slug]/page.tsx`의 `generateMetadata`에서 `alternates.languages.en` 제거

4. 링크·프리픽스 및 스위처 제거
- `src/components/layout/Header.tsx`: `useLocale`/`prefix('/en')` 사용 제거, 모든 링크를 루트 기준으로 변경
- `src/components/layout/NavLinks.tsx`: 프리픽스 제거, 루트 경로만 사용
- `src/components/layout/LanguageSwitcher.tsx`: 컴포넌트/사용처 완전 제거
- `src/lib/i18n/link.ts`: `prefixPath`가 항상 빈 문자열을 반환하도록 수정 또는 삭제

5. 영어 메시지 파일 삭제
- `src/messages/en.json` 삭제(참조도 제거)

6. 로그아웃/리다이렉트 정리
- `src/components/layout/LogoutButton.tsx`: 로케일 분기 삭제, 리다이렉트를 `'/'`로 고정

## 파일 편집 목록
- `next-intl.config.ts` 또는 `next-intl.config.mjs`
- `src/i18n/config.ts`, `src/i18n/getLocale.ts`, `src/i18n/messages.ts`
- `middleware.ts`
- `src/app/layout.tsx`
- `src/app/(blog)/posts/[slug]/page.tsx`
- `src/components/layout/Header.tsx`, `src/components/layout/NavLinks.tsx`
- `src/components/layout/LanguageSwitcher.tsx`(삭제)
- `src/lib/i18n/link.ts`
- `src/messages/en.json`(삭제)
- `src/components/layout/LogoutButton.tsx`

## 검증 계획
- `npm run typecheck` 통과
- 로컬/배포에서:
  - `/` 및 주요 페이지(`/posts`, `/privacy`, `/terms`) 정상 동작
  - `/en` 접근 시 더 이상 리라이트되지 않으며(404 예상), 헤더/내비에서 `/en`으로 가는 링크가 존재하지 않음
  - 번역 훅(`useTranslations`) 정상 동작(한국어 메시지 로드만)

## 마이그레이션 영향
- 북마크/검색/정적 피드(rss/atom/sitemap) 주소에 로케일 분기가 사라집니다(한국어 단일 도메인 기준)
- 외부에서 `/en` 링크가 유입될 경우 404가 발생하므로, 필요 시 별도 리다이렉트 규칙을 CDN/호스팅 레벨에서 추가할 수 있습니다(옵션).

위 계획대로 진행해도 될까요?