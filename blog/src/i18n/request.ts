import { getRequestConfig } from 'next-intl/server';
import { getMessages } from './messages';
import { defaultLocale } from './config';

export default getRequestConfig(async ({ locale }) => ({
  locale: locale || defaultLocale,
  messages: await getMessages(locale || defaultLocale),
  timeZone: 'Asia/Seoul',
}));
