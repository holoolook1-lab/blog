export const PRIVACY_VERSION = '1.0.0';
export const TERMS_VERSION = '1.0.0';

// 로컬 동의 마커 저장/조회: 콜백 성공 시 서버로 전송
export function markConsentInClient(opts: { privacy: boolean; terms: boolean }) {
  try {
    const payload = {
      privacy: !!opts.privacy,
      terms: !!opts.terms,
      privacy_version: PRIVACY_VERSION,
      terms_version: TERMS_VERSION,
      ts: Date.now(),
    };
    localStorage.setItem('consent_versions', JSON.stringify(payload));
  } catch {}
}

export function getConsentMarkFromClient(): {
  privacy: boolean;
  terms: boolean;
  privacy_version: string;
  terms_version: string;
  ts: number;
} | null {
  try {
    const raw = localStorage.getItem('consent_versions');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearConsentMark() {
  try {
    localStorage.removeItem('consent_versions');
  } catch {}
}

