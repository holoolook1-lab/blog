/**
 * Next.js 빌드 환경 감지 유틸리티
 * 
 * 빌드 중 자체 API 호출 회피 및 안전한 데이터 페칭을 위한 유틸리티 함수
 */

/**
 * 현재 Next.js 빌드 중인지 감지
 * 빌드 중에는 자체 API 엔드포인트 호출이 실패할 수 있음
 */
export function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME ||
    // 빌드 중에는 globalThis.fetch가 존재하지 않음
    (typeof globalThis !== 'undefined' && !globalThis.fetch)
  );
}

/**
 * 서버 사이드 렌더링 중인지 감지
 */
export function isServerSide(): boolean {
  return typeof window === 'undefined';
}

/**
 * 안전한 API 호출 래퍼
 * 빌드 중에는 자동으로 대체 데이터 소스 사용
 */
export async function safeApiCall<T>(
  apiUrl: string,
  options?: RequestInit,
  fallback?: () => Promise<T>
): Promise<T | null> {
  // 빌드 중이면 API 호출을 시도하지 않음
  if (isBuildTime()) {
    console.warn(`[Build Time] API 호출 스킵: ${apiUrl}`);
    return fallback ? await fallback() : null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(apiUrl, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`API 호출 실패: ${apiUrl}`, error);
    
    // fallback 함수가 제공되면 실행
    if (fallback) {
      return await fallback();
    }
    
    return null;
  }
}

/**
 * Supabase 클라이언트가 스텁인지 확인
 */
export function isSupabaseStub(supabase: any): boolean {
  return !supabase?.from || typeof supabase.from !== 'function';
}

/**
 * 개발 환경에서만 로그 출력
 */
export function devLog(level: 'log' | 'warn' | 'error', message: string, ...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console[level](`[Dev] ${message}`, ...args);
  }
}