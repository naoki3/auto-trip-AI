import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getLang } from '@/lib/lang';
import { supabase } from '@/lib/db';
import Header from '@/components/Header';
import TripCard from '@/components/TripCard';
import { t, type Lang } from '@/lib/i18n';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');
  const lang = await getLang();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={session.isAdmin} lang={lang} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">{t('tripList', 'title', lang)}</h2>
          <Link
            href="/trips/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {t('tripList', 'newTrip', lang)}
          </Link>
        </div>
        <Suspense fallback={<div className="text-center py-12 text-gray-400">{t('common', 'loading', lang)}</div>}>
          <TripList userId={session.userId} lang={lang} />
        </Suspense>
      </main>
    </div>
  );
}

async function TripList({ userId, lang }: { userId: string; lang: Lang }) {
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!trips || trips.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-4">✈️</p>
        <p className="font-medium mb-1">{t('tripList', 'noTrips', lang)}</p>
        <p className="text-sm mb-6">{t('tripList', 'noTripsDesc', lang)}</p>
        <Link
          href="/trips/new"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {t('tripList', 'firstTrip', lang)}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} lang={lang} />
      ))}
    </div>
  );
}
