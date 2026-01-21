import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);

    const { uid, priceId } = await request.json();

    if (!uid || !priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://premarket.homes';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/join/success?session_id={CHECKOUT_SESSION_ID}&uid=${uid}`,
      cancel_url: `${baseUrl}/join/terms`,
      metadata: {
        uid,
      },
      subscription_data: {
        metadata: {
          uid,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe session error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
