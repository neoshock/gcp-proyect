// pages/api/generate-numbers.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateUniqueFiveDigitNumbers(count: number, max: number, exclude: number[]): number[] {
    const MIN = 10000;
    const MAX = Math.min(max, 99999);

    if (MAX < MIN) throw new Error(`El valor máximo debe ser al menos ${MIN} para cumplir los 5 dígitos`);

    const excludeSet = new Set(exclude.filter(n => n >= MIN && n <= MAX));

    // Generar el conjunto de candidatos válidos
    const available: number[] = [];
    for (let i = MIN; i <= MAX; i++) {
        if (!excludeSet.has(i)) {
            available.push(i);
        }
    }

    if (available.length < count) {
        throw new Error(`No hay suficientes números únicos de 5 dígitos disponibles. Solicitados: ${count}, Disponibles: ${available.length}`);
    }

    // Mezclar y seleccionar aleatoriamente
    const result: number[] = [];
    const usedIndexes = new Set<number>();

    while (result.length < count) {
        const index = Math.floor(Math.random() * available.length);
        if (!usedIndexes.has(index)) {
            result.push(available[index]);
            usedIndexes.add(index);
        }
    }

    return result;
}

export async function POST(req: NextRequest) {
    try {
        const { name, email, amount, stripeSessionId } = await req.json();

        // 1. Obtener la rifa activa
        const { data: activeRaffle, error: raffleError } = await supabase
            .from('raffles')
            .select('id, total_numbers')
            .eq('is_active', true)
            .single();

        if (raffleError || !activeRaffle) {
            return NextResponse.json({ success: false, error: 'No hay una rifa activa disponible' }, { status: 400 });
        }

        const raffleId = activeRaffle.id;
        const maxNumber = activeRaffle.total_numbers || 99999;

        // 2. Verificar o crear participante
        const { data: existingParticipant } = await supabase
            .from('participants')
            .select('*')
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

        // 3. Obtener números ya asignados para esta rifa
        const { data: usedEntries, error: usedEntriesError } = await supabase
            .from('raffle_entries')
            .select('number')
            .eq('raffle_id', raffleId);

        if (usedEntriesError) {
            console.error('Error al obtener números usados:', usedEntriesError);
            return NextResponse.json({ success: false, error: 'Error al verificar números disponibles' }, { status: 500 });
        }

        const usedNumbers = usedEntries?.map(e => e.number) || [];

        // 4. Obtener números pre-asignados como premios menores ("blessed numbers")
        const { data: blessedNumbers, error: blessedNumbersError } = await supabase
            .from('blessed_numbers')
            .select('number, id')
            .eq('raffle_id', raffleId);

        if (blessedNumbersError) {
            console.error('Error al obtener números bendecidos:', blessedNumbersError);
        }

        const premiumNumbers = blessedNumbers?.map(bn => bn.number) || [];
        const blessedNumbersMap = blessedNumbers?.reduce((acc, bn) => {
            acc[bn.number] = bn.id;
            return acc;
        }, {} as Record<number, string>) || {};

        // 5. Generar nuevos números únicos (excluyendo los ya usados)
        const requestedAmount = parseInt(amount.toString());
        if (isNaN(requestedAmount) || requestedAmount <= 0) {
            return NextResponse.json({ success: false, error: 'Cantidad inválida' }, { status: 400 });
        }

        // Verificar si hay suficientes números disponibles
        if (maxNumber - usedNumbers.length < requestedAmount) {
            return NextResponse.json({
                success: false,
                error: `No hay suficientes números disponibles. Solicitados: ${requestedAmount}, Disponibles: ${maxNumber - usedNumbers.length}`
            }, { status: 400 });
        }

        const newNumbers = generateUniqueFiveDigitNumbers(requestedAmount, maxNumber, usedNumbers);

        // Verificación adicional: asegurar que no haya duplicados
        const uniqueNewNumbers = [...new Set(newNumbers)];
        if (uniqueNewNumbers.length !== newNumbers.length) {
            console.error('Se detectaron duplicados en los números generados');
            return NextResponse.json({ success: false, error: 'Error interno: se generaron números duplicados' }, { status: 500 });
        }

        // 6. Preparar entradas para inserción
        const entriesToInsert = newNumbers.map(num => {
            const isBlessedNumber = premiumNumbers.includes(num);

            return {
                number: num,
                participant_id: participantId,
                raffle_id: raffleId,
                payment_status: 'paid',
                stripe_session_id: stripeSessionId,
                purchased_at: new Date().toISOString(),
                is_winner: isBlessedNumber
            };
        });

        // 7. Insertar entradas en la base de datos - usando upsert con onConflict para evitar errores duplicados
        const { error: entriesError } = await supabase
            .from('raffle_entries')
            .upsert(entriesToInsert, {
                onConflict: 'raffle_id,number',
                ignoreDuplicates: true
            });

        if (entriesError) {
            console.error('Error al insertar entradas:', entriesError);
            return NextResponse.json({
                success: false,
                error: 'Error al registrar los números',
                details: entriesError.message
            }, { status: 500 });
        }

        // 8. Actualizar los números bendecidos que fueron asignados
        const assignedBlessedNumbers = newNumbers.filter(num => premiumNumbers.includes(num));

        if (assignedBlessedNumbers.length > 0) {
            const updates = assignedBlessedNumbers.map(num => ({
                id: blessedNumbersMap[num],
                assigned_to: participantId
            }));

            for (const update of updates) {
                const { error } = await supabase
                    .from('blessed_numbers')
                    .update({ assigned_to: update.assigned_to })
                    .eq('id', update.id);

                if (error) {
                    console.error('Error al actualizar número bendecido:', error);
                }
            }
        }

        return NextResponse.json({
            success: true,
            assigned: newNumbers,
            premium_numbers: assignedBlessedNumbers,
            raffle_id: raffleId,
            total_assigned: newNumbers.length
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