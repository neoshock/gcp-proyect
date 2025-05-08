import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
    maxNetworkRetries: 3,
    telemetry: false,
});

export async function POST(req: Request) {
    const { amount, price, name, email, phone, country, province, city, address } = await req.json();
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            metadata: {
                name,
                email,
                phone,
                country,
                province,
                city,
                address,
                amount: amount.toString()
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Paquete de ${amount} números`,
                        },
                        unit_amount: price * 100,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?email=${email}&amount=${amount}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
        });

        return NextResponse.json({ id: session.id });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al crear sesión' }, { status: 500 });
    }
}
