import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Header from '@/components/Header';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={session.isAdmin} />
      <main className="max-w-2xl mx-auto px-4 py-4">
        <p className="text-gray-600">Welcome, {session.username}!</p>
      </main>
    </div>
  );
}
