export async function getMessages(locale: string) {
  if (locale === 'en') {
    const m = await import('@/messages/en.json');
    return m.default;
  }
  const m = await import('@/messages/ko.json');
  return m.default;
}
