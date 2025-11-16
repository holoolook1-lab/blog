// 로컬 개발용 하드코딩 Supabase 설정(민감정보 제거)
// 실제 운영/개발 키는 환경변수만 사용하세요.
// 필요 시 로컬에서만 테스트하려면 아래 상수를 비공개 값으로 채우되,
// 절대 저장소에 커밋하지 마세요.

export const HARDCODED_SUPABASE_URL = '';
export const HARDCODED_SUPABASE_ANON_KEY = '';

export function hasHardcodedSupabase(): boolean {
  return !!HARDCODED_SUPABASE_URL && !!HARDCODED_SUPABASE_ANON_KEY;
}

// 추가: 서버 전용 및 외부 연동 토큰(개발용) — 저장소에는 비워둡니다
export const HARDCODED_SUPABASE_SERVICE_ROLE_KEY = '';
export const HARDCODED_GITHUB_TOKEN = '';
export const HARDCODED_REPO_URL = '';
