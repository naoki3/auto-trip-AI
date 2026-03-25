import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = await params;

  const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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

  return NextResponse.json({ ...plan, days: daysWithItems });
}
