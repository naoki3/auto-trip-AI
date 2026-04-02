import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import LangToggle from './LangToggle';
import { t, type Lang } from '@/lib/i18n';
import { supabase } from '@/lib/db';

interface Props {
  username: string;
  isAdmin: boolean;
  lang: Lang;
  userId: string;
}

export default async function Header({ username, isAdmin: _isAdmin, lang, userId }: Props) {
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', userId)
    .single();

  const isPro = user?.subscription_status === 'active';

  return (
    <header className="bg-blue-700 text-white shadow">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">{t('common', 'appName', lang)}</Link>
        <div className="flex items-center gap-3">
          <LangToggle lang={lang} />
          <Link href="/billing" className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white">
            {isPro
              ? <span className="bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full text-xs">PRO</span>
              : <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">{lang === 'ja' ? '無料' : 'Free'}</span>
            }
          </Link>
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
