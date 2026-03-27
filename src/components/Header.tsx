import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import LangToggle from './LangToggle';
import { t, type Lang } from '@/lib/i18n';

interface Props {
  username: string;
  isAdmin: boolean;
  lang: Lang;
}

export default function Header({ username, isAdmin: _isAdmin, lang }: Props) {
  return (
    <header className="bg-blue-700 text-white shadow">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">{t('common', 'appName', lang)}</Link>
        <div className="flex items-center gap-3">
          <LangToggle lang={lang} />
          <p className="text-sm text-blue-200">{username}</p>
          <form action={logout}>
            <button type="submit" className="text-xs text-blue-200 hover:text-white underline">
              {t('header', 'logout', lang)}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
