import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/lib/db';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', session.userId)
    .single();

  if (!user?.stripe_customer_id) {
    return NextResponse.json({ subscription_status: 'free' });
  }

  const stripe = getStripe();
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripe_customer_id,
    limit: 1,
    status: 'all',
  });

  const sub = subscriptions.data[0];
  const status = sub?.status === 'active' ? 'active'
    : sub?.status === 'past_due' ? 'past_due'
    : sub?.status === 'canceled' ? 'canceled'
    : 'free';

  await supabase
    .from('users')
    .update({ subscription_status: status })
    .eq('id', session.userId);

  return NextResponse.json({ subscription_status: status });
}
