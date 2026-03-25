import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateTripPlans, AIPlan } from '@/lib/ai';

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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tripId } = await params;
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', session.userId)
    .single();

  if (error || !trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  const { data: prefData } = await supabase
    .from('trip_preferences')
    .select('*')
    .eq('trip_id', tripId)
    .single();

  const plans = await generateTripPlans(trip, prefData ?? {});
  for (const plan of plans) {
    await savePlan(tripId, plan);
  }

  return NextResponse.json({ generated: plans.length });
}
