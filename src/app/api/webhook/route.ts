// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
    maxNetworkRetries: 3,
    telemetry: false,
});

export const config = {
    api: {
        bodyParser: false,
    },
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    let rawBody: Buffer;
    const sig: string | null = req.headers.get('stripe-signature');

    if (!sig) {
        return new NextResponse('Missing Stripe signature', { status: 400 });
    }

    try {
        rawBody = Buffer.from(await req.arrayBuffer());
        const event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log('✅ Webhook received: checkout.session.completed');

            const metadata = session.metadata;
            console.log('Metadata:', metadata);

            if (metadata?.orderNumber) {
                const { orderNumber, name, email, phone, amount } = metadata

                await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/raffle/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        amount: Number(amount),
                        stripeSessionId: session.id,
                    }),
                });

                await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/invoice/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderNumber,
                        status: 'completed'
                    }),
                })
            }
        }

        return new NextResponse('Webhook handled', { status: 200 });
    } catch (err) {
        console.error('❌ Error processing webhook:', err);
        return new NextResponse('Webhook Error', { status: 400 });
    }
}
