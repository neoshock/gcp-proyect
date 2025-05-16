import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Buscar participante
    const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('email', email)
        .single();

    if (participantError || !participant) {
        return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 });
    }

    // Obtener todos los números que le pertenecen al participante
    const { data: entries, error: entriesError } = await supabase
        .from('raffle_entries')
        .select('number, raffle_id')
        .eq('participant_id', participant.id);

    if (entriesError) {
        return NextResponse.json({ error: 'Error al buscar entradas' }, { status: 500 });
    }

    const numbers = entries.map(entry => entry.number);

    // Obtener los números bendecidos asignados a este participante
    const { data: blessed, error: blessedError } = await supabase
        .from('blessed_numbers')
        .select('number, is_minor_prize')
        .eq('assigned_to', participant.id);

    if (blessedError) {
        return NextResponse.json({ error: 'Error al buscar números ganadores' }, { status: 500 });
    }

    const blessedMap = new Map<string, { is_minor_prize: boolean }>();
    blessed.forEach(b => blessedMap.set(b.number, { is_minor_prize: b.is_minor_prize }));

    // Unir info
    const result = numbers.map(number => ({
        number,
        is_blessed: blessedMap.has(number),
        is_minor_prize: blessedMap.get(number)?.is_minor_prize ?? false
    }));

    return NextResponse.json({ numbers: result });
}
