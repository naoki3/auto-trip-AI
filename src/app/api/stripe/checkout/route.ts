import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getStripe, STRIPE_PRICE_ID } from '@/lib/stripe';
import { supabase } from '@/lib/db';

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  // Get or create Stripe customer
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', session.userId)
    .single();

  let customerId = user?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      metadata: { userId: session.userId, username: session.username },
    });
    customerId = customer.id;

    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', session.userId);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${baseUrl}/billing?success=1`,
    cancel_url: `${baseUrl}/billing?canceled=1`,
    metadata: { userId: session.userId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
