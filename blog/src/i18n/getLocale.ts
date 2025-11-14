import { cookies } from 'next/headers';
import { defaultLocale, locales } from './config';

export async function getLocale(): Promise<string> {
  try {
    const c = await cookies();
    const v = c.get('locale')?.value;
    if (v && (locales as readonly string[]).includes(v)) return v;
  } catch {}
  return defaultLocale;
}
