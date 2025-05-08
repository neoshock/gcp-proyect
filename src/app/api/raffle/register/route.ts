// pages/api/generate-numbers.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateUniqueNumbers(count: number, max: number, exclude: number[]): number[] {
    const available = Array.from({ length: max }, (_, i) => i + 1).filter(n => !exclude.includes(n));
    const result: number[] = [];

    for (let i = 0; i < count && available.length > 0; i++) {
        const index = Math.floor(Math.random() * available.length);
        result.push(available[index]);
        available.splice(index, 1);
    }

    return result;
}

export async function POST(req: NextRequest) {
    const { name, email, amount, stripeSessionId } = await req.json();

    // 1. Verificar o crear participante
    const { data: existingParticipant } = await supabase
        .from('participants')
        .select('*')
        .eq('email', email)
        .single();

    let participantId = existingParticipant?.id;

    if (!participantId) {
        const { data: newParticipant } = await supabase
            .from('participants')
            .insert({ name, email })
            .select()
            .single();

        participantId = newParticipant.id;
    }

    // 2. Obtener números ya asignados
    const { data: usedEntries } = await supabase
        .from('raffle_entries')
        .select('number');

    const usedNumbers = usedEntries?.map(e => e.number) || [];

    // 3. Generar nuevos números únicos
    const newNumbers = generateUniqueNumbers(amount, 99999, usedNumbers);

    const entriesToInsert = newNumbers.map(num => ({
        number: num,
        participant_id: participantId,

        payment_status: 'paid',
        stripe_session_id: stripeSessionId,
        purchased_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('raffle_entries').insert(entriesToInsert);

    if (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Error al registrar los números' }, { status: 500 });
    }

    return NextResponse.json({ success: true, assigned: newNumbers }, { status: 200 });
}
