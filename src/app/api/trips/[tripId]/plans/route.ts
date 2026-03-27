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

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('user_id', session.userId)
    .single();

  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  return NextResponse.json(plans ?? []);
}
