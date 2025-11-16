export function computeReadingMinutes(html: string, wordsPerMinute: number = 200): number {
  const plain = (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = plain ? plain.split(' ').filter(Boolean).length : 0;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

