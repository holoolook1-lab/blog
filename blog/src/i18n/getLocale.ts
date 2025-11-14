import { defaultLocale } from './config';

export async function getLocale(): Promise<string> {
  return defaultLocale;
}
