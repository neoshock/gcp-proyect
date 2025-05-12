// src/app/api/resend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { Invoice } from '../../types/invoices';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {

  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }
  const invoice: Invoice = rawBody.record;

  console.log('Invoice data:', invoice);

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
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
    invoice.order_number
  )}&scale=3&includetext`;

  return `
    <div style="font-family: sans-serif; color: #333; max-width: 700px; margin: auto; border: 1px solid #eee; padding: 20px;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
        <img src="https://www.proyectocolorado.com/_next/image?url=%2Fimages%2Flogo-secondary.png&w=3840&q=75" alt="Logo" style="max-width: 200px;" />
      </div>

      <!-- Body -->
      <h2 style="margin-top: 30px;">Factura emitida</h2>
      <p>Hola <strong>${invoice.full_name}</strong>,</p>
      <p>Tu factura con número de orden 
        <strong style="color: #8B0000;">${invoice.order_number}</strong> ha sido generada.
      </p>

      <!-- Two Columns: Details + Barcode -->
      <div style="display: flex; justify-content: space-between; margin-top: 30px;">
        <!-- Billing Info -->
        <table style="width: 60%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0;"><strong>Total:</strong></td>
            <td>$${invoice.total_price.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Método de pago:</strong></td>
            <td>${invoice.payment_method}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Fecha:</strong></td>
            <td>${new Date(invoice.created_at).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; vertical-align: top;"><strong>Dirección:</strong></td>
            <td>${invoice.address}, ${invoice.city}, ${invoice.province}, ${invoice.country}</td>
          </tr>
        </table>

        <!-- Barcode -->
        <div style="width: 35%; text-align: right;">
          <img src="${barcodeUrl}" alt="Código de barras" style="max-width: 100%; height: auto;" />
        </div>
      </div>

      <p style="margin-top: 30px;">Gracias por tu compra.</p>

      <!-- Footer -->
      <div style="border-top: 1px solid #ccc; margin-top: 40px; padding-top: 15px; font-size: 12px; color: #666; text-align: center;">
        Proyecto Colorado © ${new Date().getFullYear()}<br/>
        www.proyectocolorado.com | contacto@proyectocolorado.com
      </div>
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
