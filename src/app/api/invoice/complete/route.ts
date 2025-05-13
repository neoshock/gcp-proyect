import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: NextRequest) {
    try {
        const { orderNumber, status } = await req.json();

        if (!orderNumber || !status) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('invoices') 
            .update({ status })
            .eq('order_number', orderNumber);

        if (error) {
            console.error('Error al actualizar factura:', error);
            return NextResponse.json({ error: 'Error al actualizar factura.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error en el endpoint /invoice/complete:', err);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
