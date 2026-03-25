import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';

import Link from 'next/link';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/db';
import Header from '@/components/Header';
import PlanCard from '@/components/PlanCard';
import { generateTripPlans } from '@/lib/ai';
import { AIPlan } from '@/lib/ai';

interface Props {
  params: Promise<{ tripId: string }>;
}

async function savePlan(tripId: string, plan: AIPlan): Promise<void> {
  const planId = crypto.randomUUID();
  await supabase.from('plans').insert({
    id: planId,
    trip_id: tripId,
    plan_type: plan.plan_type,
    summary: plan.summary,
    estimated_cost: plan.estimated_cost,
    transfer_count: plan.transfer_count,
    walking_score: plan.walking_score,
    created_at: new Date().toISOString(),
  });

  for (const day of plan.days) {
    const dayId = crypto.randomUUID();
    await supabase.from('itinerary_days').insert({
      id: dayId,
      plan_id: planId,
      day_number: day.day_number,
      title: day.title,
      created_at: new Date().toISOString(),
    });

    for (let i = 0; i < day.items.length; i++) {
      const item = day.items[i];
      await supabase.from('itinerary_items').insert({
        id: crypto.randomUUID(),
        day_id: dayId,
        item_type: item.item_type,
        start_time: item.start_time,
        end_time: item.end_time,
        title: item.title,
        metadata_json: JSON.stringify(item.metadata_json),
        sort_order: i,
        created_at: new Date().toISOString(),
      });
    }
  }
}

export default async function PlansPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { tripId } = await params;

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', session.userId)
    .single();

  if (!trip) notFound();

  const daysLabel = trip.days === 1 ? '日帰り' : `${trip.days - 1}泊${trip.days}日`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={session.isAdmin} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-1">
          <Link href="/" className="text-xs text-blue-600 hover:underline">← 旅行一覧</Link>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {trip.origin} → {trip.destination}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{daysLabel} のプラン比較</p>
        </div>
        <Suspense fallback={
          <div className="text-center py-12 bg-white rounded-xl border">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-medium text-gray-700">AIがプランを生成中...</p>
            <p className="text-sm mt-1 text-gray-400">4種類のプランを考えています（30〜60秒）</p>
          </div>
        }>
          <PlansContent tripId={tripId} trip={trip} />
        </Suspense>
      </main>
    </div>
  );
}

async function PlansContent({ tripId, trip }: { tripId: string; trip: Record<string, unknown> }) {
  let { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (!plans || plans.length === 0) {
    const { data: prefData } = await supabase
      .from('trip_preferences')
      .select('*')
      .eq('trip_id', tripId)
      .single();

    const generated = await generateTripPlans(trip as never, prefData ?? {});
    for (const plan of generated) {
      await savePlan(tripId, plan);
    }

    const result = await supabase
      .from('plans')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });
    plans = result.data;
  }

  const PLAN_ORDER = ['fastest', 'cheapest', 'relaxed', 'sightseeing'];
  const sortedPlans = (plans ?? []).sort(
    (a, b) => PLAN_ORDER.indexOf(a.plan_type) - PLAN_ORDER.indexOf(b.plan_type)
  );

  if (sortedPlans.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border text-gray-500">
        <p className="text-3xl mb-3">⚠️</p>
        <p className="font-medium">プランの生成に失敗しました</p>
        <p className="text-sm mt-1">ページを再読み込みして再試行してください</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sortedPlans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} tripId={tripId} />
      ))}
    </div>
  );
}
