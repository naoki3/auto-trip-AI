import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import Link from 'next/link';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/db';
import Header from '@/components/Header';
import TripCard from '@/components/TripCard';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={session.isAdmin} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">旅行一覧</h2>
          <Link
            href="/trips/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + 新しい旅行を計画
          </Link>
        </div>
        <Suspense fallback={<div className="text-center py-12 text-gray-400">読み込み中...</div>}>
          <TripList userId={session.userId} />
        </Suspense>
      </main>
    </div>
  );
}

async function TripList({ userId }: { userId: string }) {
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!trips || trips.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-4">✈️</p>
        <p className="font-medium mb-1">旅行プランがまだありません</p>
        <p className="text-sm mb-6">行き先と日数を入力するとAIがプランを提案します</p>
        <Link
          href="/trips/new"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          最初の旅行を計画する
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
