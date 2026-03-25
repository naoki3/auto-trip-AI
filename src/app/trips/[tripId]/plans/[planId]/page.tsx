import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';

import Link from 'next/link';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/db';
import Header from '@/components/Header';
import ScheduleTimeline from '@/components/ScheduleTimeline';
import ReplanForm from '@/components/ReplanForm';

interface Props {
  params: Promise<{ tripId: string; planId: string }>;
}

const PLAN_TYPE_LABELS: Record<string, string> = {
  fastest: '最短プラン',
  cheapest: '最安プラン',
  relaxed: '楽・荷物考慮プラン',
  sightseeing: '観光重視プラン',
};

export default async function PlanDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { tripId, planId } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={session.isAdmin} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Suspense fallback={<div className="text-center py-12 text-gray-400">読み込み中...</div>}>
          <PlanDetailContent tripId={tripId} planId={planId} userId={session.userId} />
        </Suspense>
      </main>
    </div>
  );
}

async function PlanDetailContent({
  tripId,
  planId,
  userId,
}: {
  tripId: string;
  planId: string;
  userId: string;
}) {
  const [{ data: trip }, { data: plan }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).eq('user_id', userId).single(),
    supabase.from('plans').select('*').eq('id', planId).single(),
  ]);

  if (!trip || !plan) notFound();

  const { data: days } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('plan_id', planId)
    .order('day_number');

  const daysWithItems = await Promise.all(
    (days ?? []).map(async (day) => {
      const { data: items } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('day_id', day.id)
        .order('sort_order');
      return { ...day, items: items ?? [] };
    })
  );

  const daysLabel = trip.days === 1 ? '日帰り' : `${trip.days - 1}泊${trip.days}日`;
  const planLabel = PLAN_TYPE_LABELS[plan.plan_type] ?? plan.plan_type;

  return (
    <>
      <div className="mb-1">
        <Link href={`/trips/${tripId}/plans`} className="text-xs text-blue-600 hover:underline">
          ← プラン一覧に戻る
        </Link>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">{planLabel}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {trip.origin} → {trip.destination} / {daysLabel}
        </p>
      </div>

      {plan.summary && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 text-sm text-gray-700">
          {plan.summary}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6 text-sm">
        {plan.estimated_cost != null && (
          <span className="bg-white border rounded-full px-3 py-1">
            💰 約 ¥{plan.estimated_cost.toLocaleString()}
          </span>
        )}
        {plan.transfer_count != null && (
          <span className="bg-white border rounded-full px-3 py-1">
            🔁 乗り換え {plan.transfer_count}回
          </span>
        )}
        {plan.walking_score != null && (
          <span className="bg-white border rounded-full px-3 py-1">
            🚶 歩き {plan.walking_score}/10
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <ScheduleTimeline days={daysWithItems} />
      </div>

      <ReplanForm planId={planId} tripId={tripId} />
    </>
  );
}
