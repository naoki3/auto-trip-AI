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
    .select('*')
    .eq('id', moveId)
    .eq('item_type', 'move')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const metadata = data.metadata_json ? JSON.parse(data.metadata_json) : {};

  return NextResponse.json({ ...data, metadata });
}
