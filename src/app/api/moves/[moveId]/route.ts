import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ moveId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { moveId } = await params;
  const { data, error } = await supabase
    .from('itinerary_items')
    .select('*, itinerary_days!inner(plan_id, plans!inner(trip_id, trips!inner(user_id)))')
    .eq('id', moveId)
    .eq('item_type', 'move')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Verify ownership
  const tripUserId = (data as unknown as { itinerary_days: { plans: { trips: { user_id: string } } } })
    .itinerary_days?.plans?.trips?.user_id;
  if (tripUserId !== session.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { itinerary_days: _days, ...item } = data as typeof data & { itinerary_days: unknown };
  const metadata = item.metadata_json ? JSON.parse(item.metadata_json) : {};

  return NextResponse.json({ ...item, metadata });
}
