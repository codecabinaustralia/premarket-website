import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/adminApp';

export async function POST(request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(stripeSecretKey);

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const uid = session.metadata?.uid;

        if (uid) {
          await adminDb.collection('users').doc(uid).update({
            active: true,
            pro: true,
            agent: true,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: 'active',
            updatedAt: new Date(),
          });
          console.log(`User ${uid} activated after checkout`);
        } else {
          console.warn('checkout.session.completed missing uid in metadata');
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        const uid = subscription.metadata?.uid;

        if (uid) {
          await adminDb.collection('users').doc(uid).update({
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            updatedAt: new Date(),
          });
          console.log(`Subscription created for user ${uid}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const uid = subscription.metadata?.uid;

        if (uid) {
          const isActive = ['active', 'trialing'].includes(subscription.status);
          await adminDb.collection('users').doc(uid).update({
            active: isActive,
            pro: isActive,
            subscriptionStatus: subscription.status,
            updatedAt: new Date(),
          });
          console.log(`Subscription updated for user ${uid}: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const uid = subscription.metadata?.uid;

        if (uid) {
          await adminDb.collection('users').doc(uid).update({
            active: false,
            pro: false,
            subscriptionStatus: 'canceled',
            updatedAt: new Date(),
          });
          console.log(`User ${uid} deactivated - subscription canceled`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          // Get the subscription to find the uid
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const uid = subscription.metadata?.uid;

          if (uid) {
            await adminDb.collection('users').doc(uid).update({
              active: true,
              pro: true,
              subscriptionStatus: 'active',
              lastPaymentDate: new Date(),
              updatedAt: new Date(),
            });
            console.log(`Payment succeeded for user ${uid}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const uid = subscription.metadata?.uid;

          if (uid) {
            await adminDb.collection('users').doc(uid).update({
              subscriptionStatus: 'past_due',
              paymentFailedAt: new Date(),
              updatedAt: new Date(),
            });
            console.log(`Payment failed for user ${uid}`);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        console.log('Payment intent succeeded:', event.data.object.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        console.log('Payment intent failed:', event.data.object.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing ${event.type}:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
