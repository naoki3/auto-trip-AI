import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/db';
import Header from '@/components/Header';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: false });

  const TRANSPORT_LABELS: Record<string, string> = {
    flight: '飛行機',
    train: '電車・新幹線',
    car: '車',
    undecided: '未定',
  };

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

        {trips && trips.length > 0 ? (
          <div className="space-y-3">
            {trips.map((trip) => {
              const daysLabel = trip.days === 1 ? '日帰り' : `${trip.days - 1}泊${trip.days}日`;
              return (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}/plans`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-800">
                        {trip.origin} → {trip.destination}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {daysLabel} / {TRANSPORT_LABELS[trip.main_transport] ?? trip.main_transport}
                      </p>
                      {trip.optional_note && (
                        <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                          {trip.optional_note}
                        </p>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
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
        )}
      </main>
    </div>
  );
}
