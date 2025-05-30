import { supabase } from '../../lib/supabase';

export async function getRaffleEntries() {

  const { data, error } = await supabase
    .from('raffle_entries')
    .select('id, number, participant_id, is_winner, purchased_at')
    .order('purchased_at', { ascending: false });
  if (error) {
    throw new Error('Error al obtener los números comprados');
  }

  return data;
}

export async function createNewRaffleEntriesFromOrder(orderNumber: string, quantity: number) {
  try {
    // 1. Buscar orden existente
    const { data: order, error: orderError } = await supabase
      .from('invoices')
      .select('full_name, email, amount, status')
      .eq('order_number', orderNumber)
      .single();

    if (orderError || !order) {
      throw new Error('Orden no encontrada');
    }

    const { full_name, email, amount, status } = order;

    // 2. Validar cantidad
    if (parseInt(amount.toString()) !== quantity) {
      throw new Error(`Cantidad solicitada (${quantity}) no coincide con el total de la orden (${amount})`);
    }

    // 3. Si ya fue procesada (por status)
    if (status === 'completed') {
      return { success: true, message: 'Orden ya fue procesada previamente' };
    }

    // 4. Obtener rifa activa
    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .select('id, total_numbers')
      .eq('is_active', true)
      .single();

    if (raffleError || !raffle) {
      throw new Error('No hay una rifa activa');
    }

    const raffleId = raffle.id;
    const maxNumber = raffle.total_numbers || 99999;

    // 5. Obtener o crear participante
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('id')
      .eq('email', email)
      .single();

    let participantId = existingParticipant?.id;

    if (!participantId) {
      const { data: newParticipant, error: newError } = await supabase
        .from('participants')
        .insert({ name: full_name, email })
        .select()
        .single();

      if (newError || !newParticipant) {
        throw new Error('Error al crear participante');
      }

      participantId = newParticipant.id;
    }

    // 7. Verificar disponibilidad
    const { data: usedNumbers, error: usedError } = await supabase
      .from('raffle_entries')
      .select('number')
      .eq('raffle_id', raffleId);

    if (usedError) {
      throw new Error('Error al obtener números usados');
    }

    const usedCount = usedNumbers?.length || 0;

    if (maxNumber - usedCount < quantity) {
      throw new Error(`No hay suficientes números disponibles. Disponibles: ${maxNumber - usedCount}`);
    }

    // 8. Generar números
    const { data: generated, error: generateError } = await supabase.rpc('generate_raffle_numbers', {
      in_participant_id: participantId,
      in_raffle_id: raffleId,
      in_amount: quantity,
    });

    if (generateError) {
      throw new Error(`Error en RPC: ${generateError.message}`);
    }

    if (!generated || generated.length === 0) {
      throw new Error('No se generaron números');
    }

    if (quantity <= 1000 && generated.length !== quantity) {
      throw new Error(`Se generaron ${generated.length} en lugar de ${quantity}`);
    }

    // 9. Actualizar la orden como completada
    const { error: statusUpdateError } = await supabase
      .from('invoices')
      .update({ status: 'completed' })
      .eq('order_number', orderNumber);

    if (statusUpdateError) {
      console.warn('⚠️ No se pudo actualizar el estado de la orden:', statusUpdateError.message);
    }

    return {
      success: true,
      assigned: generated.map((g: any) => g.generated_number),
      total_assigned: generated.length,
      raffle_id: raffleId
    };

  } catch (error) {
    console.error('Error en createNewRaffleEntriesFromOrder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

