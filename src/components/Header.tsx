import Link from 'next/link';
import { logout } from '@/app/actions/auth';

interface Props {
  username: string;
  isAdmin: boolean;
}

export default function Header({ username, isAdmin }: Props) {
  return (
    <header className="bg-green-700 text-white shadow">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold tracking-tight">BetPredict AI</Link>
          {isAdmin && (
            <Link href="/admin" className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded font-semibold">
              Admin
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-green-200">{username}</p>
          <form action={logout}>
            <button type="submit" className="text-xs text-green-200 hover:text-white underline">
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
