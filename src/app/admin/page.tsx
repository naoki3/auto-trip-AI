import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { supabase, MatchRow } from '@/lib/db';
import Header from '@/components/Header';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.isAdmin) redirect('/');

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={true} />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <AdminPanel matches={(matches ?? []) as MatchRow[]} />
      </main>
    </div>
  );
}
