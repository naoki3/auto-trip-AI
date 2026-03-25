import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';

import Link from 'next/link';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/db';
import Header from '@/components/Header';
import PlanCard from '@/components/PlanCard';

interface Props {
  params: Promise<{ tripId: string }>;
}

export default async function PlansPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { tripId } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={session.isAdmin} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Suspense fallback={<div className="text-center py-12 text-gray-400">読み込み中...</div>}>
          <PlansContent tripId={tripId} userId={session.userId} />
        </Suspense>
      </main>
    </div>
  );
}

async function PlansContent({ tripId, userId }: { tripId: string; userId: string }) {
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', userId)
    .single();

  if (!trip) notFound();

  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  const daysLabel = trip.days === 1 ? '日帰り' : `${trip.days - 1}泊${trip.days}日`;

  const PLAN_ORDER = ['fastest', 'cheapest', 'relaxed', 'sightseeing'];
  const sortedPlans = (plans ?? []).sort(
    (a, b) => PLAN_ORDER.indexOf(a.plan_type) - PLAN_ORDER.indexOf(b.plan_type)
  );

  return (
    <>
      <div className="mb-1">
        <Link href="/" className="text-xs text-blue-600 hover:underline">← 旅行一覧</Link>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {trip.origin} → {trip.destination}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">{daysLabel} のプラン比較</p>
      </div>

      {sortedPlans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} tripId={tripId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
          <p className="text-3xl mb-3">⏳</p>
          <p className="font-medium">プランを生成中です...</p>
          <p className="text-sm mt-1">しばらくしてからページを更新してください</p>
        </div>
      )}
    </>
  );
}
