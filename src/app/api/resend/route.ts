// src/app/api/resend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { Invoice } from '../../types/invoices';

const resend = new Resend(process.env.RESEND_API_KEY);

type InvoiceWithStatus = Invoice & {
  status: string;
};

export async function POST(req: NextRequest) {
 
  console.log('Webhook Resend');
  
  let invoice: InvoiceWithStatus;
  try {
    invoice = await req.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  if (invoice.status !== 'completed') {
    return NextResponse.json(
      { message: 'Factura no enviada (estado no success)' },
      { status: 200 }
    );
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Facturación Rifa <team@proyectocolorado.com>',
      to: invoice.email,
      subject: `Factura emitida - Orden #${invoice.order_number}`,
      html: generateInvoiceHtml(invoice),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ message: 'Error al enviar correo' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Correo enviado con éxito' }, { status: 200 });
  } catch (err) {
    console.error('Error inesperado:', err);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

function generateInvoiceHtml(invoice: Invoice): string {
  return `
    <div style="font-family: sans-serif; color: #333;">
      <h2>Factura emitida</h2>
      <p>Hola <strong>${invoice.full_name}</strong>,</p>
      <p>Tu factura con número de orden <strong>${invoice.order_number}</strong> ha sido generada.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr><td><strong>Total:</strong></td><td>$${invoice.total_price.toFixed(2)}</td></tr>
        <tr><td><strong>Método de pago:</strong></td><td>${invoice.payment_method}</td></tr>
        <tr><td><strong>Fecha:</strong></td><td>${new Date(invoice.created_at).toLocaleDateString()}</td></tr>
        <tr><td><strong>Dirección:</strong></td><td>${invoice.address}, ${invoice.city}, ${invoice.province}, ${invoice.country}</td></tr>
      </table>
      <p style="margin-top: 30px;">Gracias por tu compra.</p>
    </div>
  `;
}

export async function GET() {
  try {
    const { error } = await resend.emails.send({
      from: 'Facturación Rifa <team@proyectocolorado.com>', 
      to: 'pideun@gmail.com',
      subject: 'Correo de prueba desde Resend',
      html: '<h1>Hello World</h1><p>Este es un correo de prueba enviado desde el endpoint GET.</p>',
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ message: 'Error al enviar correo' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Correo de prueba enviado con éxito' }, { status: 200 });
  } catch (err) {
    console.error('Error inesperado:', err);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
