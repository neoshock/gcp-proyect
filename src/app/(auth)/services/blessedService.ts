import { supabase } from '../../lib/supabase';

export async function getBlessedNumbers() {
  try {
    const { data, error } = await supabase
      .from('blessed_numbers')
      .select(`
        id, 
        number, 
        assigned_to, 
        created_at, 
        is_minor_prize, 
        participants:assigned_to(name, email)
      `)
      .order('assigned_to', { ascending: true })
      .order('is_minor_prize', { ascending: true })

    if (error) {
      console.error('Error al obtener los números bendecidos:', error);
      throw new Error('Error al obtener los números bendecidos');
    }

    console.log('Números bendecidos:', data);

    return data?.map((item: { participants: unknown; id: any; number: any; is_minor_prize: any; created_at: any; }) => {
      const participant = item.participants as unknown as { name?: string; email?: string } || {};

      return {
        id: item.id,
        number: item.number,
        name: participant.name || null,
        email: participant.email || null,
        is_minor_prize: item.is_minor_prize,
        created_at: item.created_at,
      };
    }) || [];
  } catch (error) {
    console.error('Error al obtener los números bendecidos:', error);
    throw error;
  }
}