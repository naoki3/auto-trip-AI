import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { replanTrip, AIPlan } from '@/lib/ai';

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = await params;
  const body = await req.json();
  const { user_text } = body;

  if (!user_text) return NextResponse.json({ error: 'user_text is required' }, { status: 400 });

  const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  const { data: trip } = await supabase.from('trips').select('*').eq('id', plan.trip_id).single();
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  const { plans, parsedConditions, resultSummary } = await replanTrip(
    trip,
    plan.summary ?? '',
    user_text
  );

  if (plans.length === 0) {
    return NextResponse.json({ error: 'Failed to generate replan' }, { status: 500 });
  }

  const newPlanId = await savePlan(trip.id, plans[0]);

  await supabase.from('replanning_requests').insert({
    id: crypto.randomUUID(),
    plan_id: planId,
    user_text,
    parsed_conditions_json: JSON.stringify(parsedConditions),
    result_summary: resultSummary,
    new_plan_id: newPlanId,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ new_plan_id: newPlanId, result_summary: resultSummary });
}
