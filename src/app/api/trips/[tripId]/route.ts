import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tripId } = await params;
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', session.userId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tripId } = await params;

  // Verify ownership
  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('user_id', session.userId)
    .single();

  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Delete in dependency order
  const { data: plans } = await supabase.from('plans').select('id').eq('trip_id', tripId);
  if (plans && plans.length > 0) {
    const planIds = plans.map((p) => p.id);
    const { data: days } = await supabase.from('itinerary_days').select('id').in('plan_id', planIds);
    if (days && days.length > 0) {
      const dayIds = days.map((d) => d.id);
      await supabase.from('itinerary_items').delete().in('day_id', dayIds);
    }
    await supabase.from('itinerary_days').delete().in('plan_id', planIds);
    await supabase.from('replanning_requests').delete().in('plan_id', planIds);
    await supabase.from('plans').delete().in('id', planIds);
  }
  await supabase.from('trip_preferences').delete().eq('trip_id', tripId);
  await supabase.from('trips').delete().eq('id', tripId);

  return NextResponse.json({ ok: true });
}
