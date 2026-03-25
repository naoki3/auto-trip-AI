import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { origin, destination, days, main_transport, luggage_level, optional_note } = body;

  if (!origin || !destination) {
    return NextResponse.json({ error: 'origin and destination are required' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const { error } = await supabase.from('trips').insert({
    id,
    user_id: session.userId,
    origin,
    destination,
    days: Number(days) || 1,
    main_transport: main_transport ?? 'undecided',
    luggage_level: luggage_level ?? 'normal',
    optional_note: optional_note ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id }, { status: 201 });
}
