'use client';
import { useRouter } from 'next/navigation';
import { setLang } from '@/app/actions/lang';
import type { Lang } from '@/lib/i18n';

export default function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  async function toggle() {
    await setLang(lang === 'ja' ? 'en' : 'ja');
    router.refresh();
  }
  return (
    <button
      onClick={toggle}
      className="text-xs text-blue-200 hover:text-white border border-blue-500 rounded px-2 py-0.5 transition-colors"
    >
      {lang === 'ja' ? 'EN' : 'JA'}
    </button>
  );
}
