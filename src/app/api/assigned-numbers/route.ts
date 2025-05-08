// app/api/assigned-numbers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('email', email)
        .single();

    if (participantError || !participant) {
        return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 });
    }
    const { data: entries, error: entriesError } = await supabase
        .from('raffle_entries')
        .select('number')
        .eq('participant_id', participant.id);

    if (entriesError) {
        return NextResponse.json({ error: 'Error al buscar números' }, { status: 500 });
    }

    const numbers = entries.map(entry => entry.number);

    return NextResponse.json({ numbers });
}
