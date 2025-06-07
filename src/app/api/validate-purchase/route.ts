// app/api/validate-purchase-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getActiveRaffle } from '@/app/services/raffleService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

interface TokenPayload {
    amount: number;
    price: number;
    raffleId: string;
    createdAt: number;
    exp: number;
    iat: number;
}

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Token requerido' },
                { status: 400 }
            );
        }

        // Verificar y decodificar el JWT
        let tokenData: TokenPayload;
        try {
            tokenData = jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch (jwtError: any) {
            console.error('JWT verification failed:', jwtError.message);

            if (jwtError.name === 'TokenExpiredError') {
                return NextResponse.json(
                    { error: 'Token expirado' },
                    { status: 410 } // Gone - recurso expirado
                );
            }

            return NextResponse.json(
                { error: 'Token inválido' },
                { status: 401 }
            );
        }

        // Verificar que la rifa sigue activa
        try {
            const raffle = await getActiveRaffle();

            if (!raffle || !raffle.id) {
                return NextResponse.json(
                    { error: 'No hay rifas activas disponibles' },
                    { status: 410 }
                );
            }

            // Verificar que el raffleId del token coincide con la rifa actual
            if (tokenData.raffleId !== raffle.id) {
                return NextResponse.json(
                    { error: 'Token no válido para la rifa actual' },
                    { status: 410 }
                );
            }

            // Verificar que el precio sigue siendo correcto
            const currentPrice = tokenData.amount * raffle.price;
            if (Math.abs(currentPrice - tokenData.price) > 0.01) {
                return NextResponse.json(
                    { error: 'El precio ha cambiado. Por favor, genera un nuevo token.' },
                    { status: 409 }
                );
            }

        } catch (error) {
            console.error('Error checking raffle availability:', error);
            return NextResponse.json(
                { error: 'Error verificando disponibilidad de la rifa' },
                { status: 500 }
            );
        }

        // Devolver datos validados
        return NextResponse.json({
            amount: tokenData.amount,
            price: tokenData.price,
            raffleId: tokenData.raffleId,
            expiresAt: tokenData.exp * 1000, // Convert to milliseconds
            timeRemaining: Math.max(0, tokenData.exp * 1000 - Date.now())
        });

    } catch (error) {
        console.error('Error in validate-purchase-token:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}