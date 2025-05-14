import { supabase } from '../../lib/supabase';

type WinnerEntry = {
    participant_id: string;
    is_winner: boolean;
    participants: {
        name: string;
        email: string;
    } | null;
};

export async function getWinners() {
    // Obtener ganadores
    const { data, error } = await supabase
        .from('raffle_entries')
        .select(`
      participant_id,
      is_winner,
      participants (name, email)
    `)
        .eq('is_winner', true);

    if (error || !data) {
        throw new Error('Error al obtener ganadores');
    }

    const winnersMap: Record<string, { name: string; email: string; total: number; phone?: string }> = {};

    (data as unknown as WinnerEntry[]).forEach((entry) => {
        const participant = entry.participants;
        if (participant && participant.email) {
            if (!winnersMap[participant.email]) {
                winnersMap[participant.email] = {
                    name: participant.name,
                    email: participant.email,
                    total: 1,
                };
            } else {
                winnersMap[participant.email].total += 1;
            }
        }
    });

    // Obtener teléfonos desde invoices
    const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('email, phone')
        .in('email', Object.keys(winnersMap));

    if (invoiceError) {
        throw new Error('Error al obtener teléfonos de ganadores');
    }

    invoices?.forEach((invoice) => {
        const winner = winnersMap[invoice.email];
        if (winner && invoice.phone && !winner.phone) {
            winner.phone = invoice.phone;
        }
    });

    return Object.values(winnersMap);
}
