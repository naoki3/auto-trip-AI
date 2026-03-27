'use server';

import { redirect } from 'next/navigation';
import { supabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { parseUserIntent, replanTrip, AIPlan } from '@/lib/ai';

async function savePlan(tripId: string, plan: AIPlan): Promise<string> {
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

  return planId;
}

export async function createTrip(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const origin = String(formData.get('origin') ?? '').trim();
  const destination = String(formData.get('destination') ?? '').trim();
  const days = Number(formData.get('days') ?? 1);
  const main_transport = String(formData.get('main_transport') ?? 'undecided');
  const luggage_level = String(formData.get('luggage_level') ?? 'normal');
  const companions = String(formData.get('companions') ?? '').trim() || null;
  const note = String(formData.get('optional_note') ?? '').trim() || null;
  const optional_note = [companions ? `同行者: ${companions}` : null, note].filter(Boolean).join('\n') || null;

  if (!origin || !destination) return { error: '出発地と目的地を入力してください' };

  const tripId = crypto.randomUUID();
  const { error } = await supabase.from('trips').insert({
    id: tripId,
    user_id: session.userId,
    origin,
    destination,
    days,
    main_transport,
    luggage_level,
    optional_note,
    created_at: new Date().toISOString(),
  });

  if (error) return { error: '旅行の作成に失敗しました' };

  // Parse preferences from optional_note
  let preferences = {};
  if (optional_note) {
    preferences = await parseUserIntent(optional_note);
  }

  const prefId = crypto.randomUUID();
  await supabase.from('trip_preferences').insert({
    id: prefId,
    trip_id: tripId,
    ...preferences,
    parsed_json: JSON.stringify(preferences),
    created_at: new Date().toISOString(),
  });

  redirect(`/trips/${tripId}/plans`);
}

export async function replanTripAction(
  planId: string,
  userRequest: string
): Promise<{ error?: string; newPlanId?: string; resultSummary?: string }> {
  const session = await getSession();
  if (!session) return { error: '認証が必要です' };

  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (!plan) return { error: 'プランが見つかりません' };

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', plan.trip_id)
    .single();

  if (!trip) return { error: '旅行が見つかりません' };

  const { data: prefData } = await supabase
    .from('trip_preferences')
    .select('*')
    .eq('trip_id', trip.id)
    .single();

  const existingPlanSummary = plan.summary ?? '';
  const { plans, parsedConditions, resultSummary } = await replanTrip(
    trip,
    existingPlanSummary,
    userRequest,
    prefData ?? {}
  );

  if (plans.length === 0) return { error: '再設計に失敗しました' };

  const replanId = crypto.randomUUID();
  const newPlanId = await savePlan(trip.id, plans[0]);

  await supabase.from('replanning_requests').insert({
    id: replanId,
    plan_id: planId,
    user_text: userRequest,
    parsed_conditions_json: JSON.stringify(parsedConditions),
    result_summary: resultSummary,
    new_plan_id: newPlanId,
    created_at: new Date().toISOString(),
  });

  return { newPlanId, resultSummary };
}
