// 슬러그 규칙 공통 유틸: 생성/검증/정규화
// - normalizeSlug: 저장/조회 시 반드시 적용(NFKC, trim, lowercase)
// - slugifyKorean: 제목에서 슬러그 생성(한글/영문/숫자/하이픈만, 구분자 -> 하이픈)
// - isValidSlug: 허용 문자/길이/하이픈 규칙 검증

export function normalizeSlug(input: string): string {
  return (input || '').normalize('NFKC').trim().toLowerCase();
}

export function slugifyKorean(input: string): string {
  const s = normalizeSlug(input);
  const replaced = s
    // 구분자/특수문자 제거
    .replace(/['".,/\\:_#?!()\[\]{}]+/g, '')
    // 공백을 하이픈으로 치환
    .replace(/\s+/g, '-')
    // 허용 문자만 남김(한글/영문/숫자/하이픈)
    .replace(/[^a-z0-9ㄱ-ㅎ가-힣-]+/g, '')
    // 하이픈 중복 축약
    .replace(/-+/g, '-')
    // 잘못된 앞뒤/연속 하이픈 보정
    .replace(/^-|-$|--/g, '-');
  return replaced.replace(/^-+|-+$/g, '');
}

export function isValidSlug(x: string): boolean {
  const v = normalizeSlug(x);
  if (v.length < 3 || v.length > 64) return false;
  if (!/^[a-z0-9ㄱ-ㅎ가-힣-]+$/.test(v)) return false;
  if (/--/.test(v)) return false;
  if (/^-|-$/.test(v)) return false;
  return true;
}

