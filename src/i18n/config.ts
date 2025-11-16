export const locales = ['ko'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ko';
