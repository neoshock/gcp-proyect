import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import type { Invoice } from '../../types/invoices';

// Inicializa Resend con tu API Key
const resend = new Resend(process.env.RESEND_API_KEY);

type InvoiceWithStatus = Invoice & {
  status: string;
};

export async function POST(
  req: NextApiRequest,
  res: NextApiResponse
) {
  
  // Valida tu webhook secret opcionalmente
  if (
    process.env.SUPABASE_WEBHOOK_SECRET &&
    req.headers['x-webhook-secret'] !== process.env.SUPABASE_WEBHOOK_SECRET
  ) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const invoice = req.body as InvoiceWithStatus;

  // Solo procesar si el estado es success
  if (invoice.status !== 'success') {
    return res
      .status(200)
      .json({ message: 'Factura no enviada (estado no success)' });
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Facturación Rifa <facturacion@tudominio.com>', // debe estar verificado
      to: invoice.email,
      subject: `Factura emitida - Orden #${invoice.order_number}`,
      html: generateInvoiceHtml(invoice),
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ message: 'Error al enviar correo' });
    }

    return res.status(200).json({ message: 'Correo enviado con éxito' });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

function generateInvoiceHtml(invoice: Invoice): string {
  return `
    <div style="font-family: sans-serif; color: #333;">
      <h2>Factura emitida</h2>
      <p>Hola <strong>${invoice.full_name}</strong>,</p>
      <p>Tu factura con número de orden <strong>${invoice.order_number}</strong> ha sido generada.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td><strong>Total:</strong></td>
          <td>$${invoice.total_price.toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>Método de pago:</strong></td>
          <td>${invoice.payment_method}</td>
        </tr>
        <tr>
          <td><strong>Fecha:</strong></td>
          <td>${new Date(invoice.created_at).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td><strong>Dirección:</strong></td>
          <td>${invoice.address}, ${invoice.city}, ${invoice.province}, ${invoice.country}</td>
        </tr>
      </table>
      <p style="margin-top: 30px;">Gracias por tu compra.</p>
    </div>
  `;
}
