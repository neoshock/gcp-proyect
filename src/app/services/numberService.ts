// services/numberService.ts
import { supabase } from '../lib/supabase';
import { BlessedNumber, TicketPurchase } from '../types/tickets';

/**
 * Obtiene los números bendecidos desde Supabase
 * @returns Lista de números bendecidos
 */
export const getBlessedNumbers = async (
  raffleId: string
): Promise<BlessedNumber[]> => {
  try {
    const { data, error } = await supabase
      .from('blessed_numbers')
      .select('*')
      .eq('raffle_id', raffleId)
      .or('is_minor_prize.is.false,is_minor_prize.is.null') // solo mayores
      .order('number', { ascending: true });

    if (error) {
      console.error('Error fetching blessed numbers:', error);
      throw new Error(error.message);
    }

    return data?.map(item => ({
      id: item.id,
      value: item.number,
      claimed: !!item.assigned_to,
      claimedBy: item.assigned_to,
      createdAt: item.created_at
    })) || [];
  } catch (error) {
    console.error('Error in getBlessedNumbers:', error);
    throw error;
  }
};


/**
 * Verifica si un número está disponible (no ha sido asignado)
 * @param number Número a verificar
 * @returns true si el número está disponible, false en caso contrario
 */
export const isNumberAvailable = async (number: number): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('blessed_numbers')
      .select('id, assigned_to')
      .eq('number', number)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 es el código cuando no se encuentra un registro
      console.error('Error checking number availability:', error);
      throw new Error(error.message);
    }

    return !data || !data.assigned_to; // Si no hay datos o assigned_to es null, el número está disponible
  } catch (error) {
    console.error('Error in isNumberAvailable:', error);
    throw error;
  }
};

/**
 * Obtiene los tickets comprados por un usuario
 * @param email Email del usuario
 * @returns Lista de compras del usuario
 */

const PAGE_SIZE = 1000;

export const getUserTickets = async (email: string): Promise<TicketPurchase[]> => {
  try {

    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (!participant) {
      throw new Error('Participant not found');
    }

    if (participantError) {
      console.error('Error fetching participant:', participantError);
      throw new Error('Participant not found');
    }

    const participantId = participant.id;
    let from = 0;
    let to = PAGE_SIZE - 1;
    let allEntries: any[] = [];

    while (true) {
      const { data, error, count } = await supabase
        .from('raffle_entries')
        .select(`
          id,
          raffle_id,
          is_winner,
          number,
          payment_status,
          purchased_at
        `, { count: 'exact' }) // opcional, útil si quieres saber total
        .eq('participant_id', participantId)
        .range(from, to)
        .order('purchased_at', { ascending: false });

      if (error) {
        console.error('Error fetching raffle entries:', error);
        throw new Error(error.message);
      }

      allEntries = allEntries.concat(data);

      if (data.length < PAGE_SIZE) break; // ya se trajeron todos
      from += PAGE_SIZE;
      to += PAGE_SIZE;
    }

    const purchaseGroups: { [key: string]: TicketPurchase } = {};

    allEntries.forEach(entry => {
      const key = `${entry.raffle_id}_${entry.payment_status}_${entry.purchased_at.split('T')[0]}`;

      if (!purchaseGroups[key]) {
        purchaseGroups[key] = {
          id: entry.id,
          email,
          numbers: [],
          paymentStatus: entry.payment_status,
          purchaseDate: entry.purchased_at
        };
      }

      purchaseGroups[key].numbers.push({
        number: entry.number,
        isWinner: entry.is_winner === true
      });
    });

    return Object.values(purchaseGroups);
  } catch (error) {
    console.error('Error in getUserTickets:', error);
    throw error;
  }
};

/**
 * Reclama un número bendecido (lo marca como asignado)
 * @param numberId ID del número bendecido
 * @param userId ID del participante
 * @returns El número bendecido actualizado
 */
export const claimBlessedNumber = async (numberId: string, userId: string): Promise<BlessedNumber> => {
  try {
    const { data, error } = await supabase
      .from('blessed_numbers')
      .update({
        assigned_to: userId
      })
      .eq('id', numberId)
      .select()
      .single();

    if (error) {
      console.error('Error claiming blessed number:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      value: data.number,
      claimed: !!data.assigned_to,
      claimedBy: data.assigned_to,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error in claimBlessedNumber:', error);
    throw error;
  }
};

/**
 * Obtiene el total de tickets vendidos
 * @returns Total de tickets vendidos
 */
export const getSoldTicketsCount = async (
  raffleId: string
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('raffle_entries')
      .select('*', { count: 'exact', head: true })
      .eq('raffle_id', raffleId)
      .neq('payment_status', 'failed');

    if (error) {
      console.error('Error fetching sold tickets count:', error);
      throw new Error(error.message);
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getSoldTicketsCount:', error);
    throw error;
  }
};