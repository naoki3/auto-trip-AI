import Link from 'next/link';
import { logout } from '@/app/actions/auth';

interface Props {
  username: string;
  isAdmin: boolean;
}

export default function Header({ username, isAdmin: _isAdmin }: Props) {
  return (
    <header className="bg-blue-700 text-white shadow">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">Auto Trip AI</Link>
        <div className="flex items-center gap-4">
          <p className="text-sm text-blue-200">{username}</p>
          <form action={logout}>
            <button type="submit" className="text-xs text-blue-200 hover:text-white underline">
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
