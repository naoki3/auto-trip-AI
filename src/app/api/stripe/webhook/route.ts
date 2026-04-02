import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/lib/db';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      if (customerId) {
        await supabase
          .from('users')
          .update({ subscription_status: 'active', stripe_customer_id: customerId })
          .eq('stripe_customer_id', customerId);
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'past_due' : 'canceled';
      const cancelAt = subscription.cancel_at;
      const endDate = cancelAt ? new Date(cancelAt * 1000).toISOString() : null;

      await supabase
        .from('users')
        .update({ subscription_status: status, subscription_end_date: endDate })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await supabase
        .from('users')
        .update({ subscription_status: 'canceled', subscription_end_date: null })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await supabase
        .from('users')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
