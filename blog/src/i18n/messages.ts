export async function getMessages(_locale: string) {
  const m = await import('@/messages/ko.json');
  return m.default;
}
