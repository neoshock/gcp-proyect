// pages/api/generate-numbers.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { name, email, amount, stripeSessionId } = await req.json();

        // 1. Evitar procesar duplicado
        const { data: existingEntries, error: checkError } = await supabase
            .from('raffle_entries')
            .select('id')
            .eq('stripe_session_id', stripeSessionId)
            .limit(1);

        if (checkError) {
            console.error('Error al verificar sesión existente:', checkError);
            return NextResponse.json({ success: false, error: 'Error interno al validar sesión' }, { status: 500 });
        }

        if (existingEntries?.length > 0) {
            return NextResponse.json({ success: true, message: 'Sesión ya procesada previamente' }, { status: 200 });
        }

        // 2. Obtener rifa activa
        const { data: raffle, error: raffleError } = await supabase
            .from('raffles')
            .select('id, total_numbers')
            .eq('is_active', true)
            .single();

        if (raffleError || !raffle) {
            return NextResponse.json({ success: false, error: 'No hay una rifa activa disponible' }, { status: 400 });
        }

        const raffleId = raffle.id;
        const maxNumber = raffle.total_numbers || 99999;

        // 3. Verificar o crear participante
        const { data: existingParticipant } = await supabase
            .from('participants')
            .select('id')
            .eq('email', email)
            .single();

        let participantId = existingParticipant?.id;

        if (!participantId) {
            const { data: newParticipant, error: participantError } = await supabase
                .from('participants')
                .insert({ name, email })
                .select()
                .single();

            if (participantError || !newParticipant) {
                return NextResponse.json({ success: false, error: 'Error al crear participante' }, { status: 500 });
            }

            participantId = newParticipant.id;
        }

        // 4. Verificar disponibilidad de números
        const { data: usedEntries, error: usedError } = await supabase
            .from('raffle_entries')
            .select('number')
            .eq('raffle_id', raffleId);

        if (usedError) {
            console.error('Error al obtener números usados:', usedError);
            return NextResponse.json({ success: false, error: 'Error al verificar números disponibles' }, { status: 500 });
        }

        const usedCount = usedEntries?.length || 0;
        const requestedAmount = parseInt(amount.toString());

        if (isNaN(requestedAmount) || requestedAmount <= 0) {
            return NextResponse.json({ success: false, error: 'Cantidad inválida' }, { status: 400 });
        }

        if (maxNumber - usedCount < requestedAmount) {
            return NextResponse.json({
                success: false,
                error: `No hay suficientes números disponibles. Solicitados: ${requestedAmount}, Disponibles: ${maxNumber - usedCount}`
            }, { status: 400 });
        }

        // 5. Llamar procedimiento almacenado
        const { data: generated, error: rpcError } = await supabase.rpc('generate_raffle_numbers', {
            in_participant_id: participantId,
            in_raffle_id: raffleId,
            in_amount: requestedAmount
        });

        if (rpcError || !generated || generated.length !== requestedAmount) {
            console.error('Error al generar números:', rpcError);
            return NextResponse.json({ success: false, error: 'Error al generar números', details: rpcError?.message }, { status: 500 });
        }

        // 6. Actualizar stripe_session_id
        const { error: updateError } = await supabase
            .from('raffle_entries')
            .update({ stripe_session_id: stripeSessionId })
            .eq('participant_id', participantId)
            .eq('raffle_id', raffleId)
            .in('number', generated.map((n: any) => n.generated_number));

        if (updateError) {
            console.warn('⚠️ No se pudo actualizar stripe_session_id:', updateError);
        }

        return NextResponse.json({
            success: true,
            assigned: generated.map((n: any) => n.generated_number),
            total_assigned: generated.length,
            raffle_id: raffleId
        }, { status: 200 });
    } catch (error) {
        console.error('Error general:', error);
        return NextResponse.json({
            success: false,
            error: 'Error inesperado',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
