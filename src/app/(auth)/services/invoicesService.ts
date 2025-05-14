// src/app/(auth)/services/getInvoices.ts
import { supabase } from '../../lib/supabase';

export async function getInvoicesList() {

    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error('Error al obtener las facturas');
    }

    return data;
}
