// 서버/클라이언트 모두에서 동작 가능한 경량 Sanitize
// 주의: 완벽한 보안이 필요하면 DOMPurify 클라이언트 적용을 권장합니다.
export const sanitizeHtml = (html: string) => {
  if (!html) return '';
  return html
    // 스크립트/스타일 태그 제거
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    // on* 이벤트 속성 제거 (onload, onclick 등)
    .replace(/ on[a-z]+="[^"]*"/gi, '')
    .replace(/ on[a-z]+=\'[^\']*\'/gi, '')
    .replace(/ on[a-z]+=\w+/gi, '')
    .replace(/ srcdoc="[^"]*"/gi, '')
    .replace(/ srcdoc=\'[^\']*\'/gi, '')
    // javascript: 프로토콜 제거
    .replace(/javascript:/gi, '');
};
