'use server';
import { cookies } from 'next/headers';
import type { Lang } from '@/lib/i18n';

export async function setLang(lang: Lang): Promise<void> {
  const jar = await cookies();
  jar.set('lang', lang, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
