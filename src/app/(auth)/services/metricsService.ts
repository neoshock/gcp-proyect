// src/app/lib/metrics.ts
import { supabase } from '../../lib/supabase';

// Utilidad para paginar y obtener todos los registros
async function fetchAllRecords(table: string, select: string) {
    const limit = 1000;
    let from = 0;
    let allData: any[] = [];

    while (true) {
        const { data, error } = await supabase
            .from(table)
            .select(select)
            .range(from, from + limit - 1);

        if (error) throw new Error(`Error al cargar datos de ${table}`);

        allData = allData.concat(data);

        if (data.length < limit) break;

        from += limit;
    }

    return allData;
}

export async function getDashboardMetrics() {
    const invoices = await fetchAllRecords('invoices', 'total_price, status, payment_method');
    const entries = await fetchAllRecords('raffle_entries', 'is_winner');

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

    const transferSales = completedInvoices
        .filter((i) => i.payment_method === 'TRANSFER')
        .reduce((sum, inv) => sum + parseFloat(inv.total_price), 0);

    const stripeSales = completedInvoices
        .filter((i) => i.payment_method === 'STRIPE')
        .reduce((sum, inv) => sum + parseFloat(inv.total_price), 0);

    const totalMethodSales = transferSales + stripeSales;
    const transferPercentage = totalMethodSales > 0
        ? +(transferSales / totalMethodSales * 100).toFixed(1)
        : 0;
    const stripePercentage = totalMethodSales > 0
        ? +(stripeSales / totalMethodSales * 100).toFixed(1)
        : 0;

    return {
        totalSales,
        totalNumbersSold,
        totalWinners,
        conversionRate,
        transferSales,
        stripeSales,
        transferPercentage,
        stripePercentage,
    };
}
