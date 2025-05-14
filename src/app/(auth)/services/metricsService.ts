// src/app/lib/metrics.ts
import { supabase } from '../../lib/supabase';

export async function getDashboardMetrics() {
    const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('total_price, status');

    const { data: entries, error: entriesError } = await supabase
        .from('raffle_entries')
        .select('is_winner');

    if (invoicesError || entriesError) {
        throw new Error('Error al cargar métricas del dashboard');
    }

    const completedInvoices = invoices.filter((i) => i.status === 'completed');
    const totalSales = completedInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.total_price),
        0
    );

    const totalNumbersSold = entries.length;
    const totalWinners = entries.filter((e) => e.is_winner).length;
    const conversionRate = invoices.length > 0
        ? +(totalSales / invoices.length).toFixed(2)
        : 0;

    return {
        totalSales,
        totalNumbersSold,
        totalWinners,
        conversionRate,
    };
}
