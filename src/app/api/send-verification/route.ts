// src/app/api/send-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    let body: any;
    try {
        body = await req.json();
    } catch (error) {
        return NextResponse.json({ message: 'Cuerpo JSON inválido' }, { status: 400 });
    }

    const { name, email, referralLink, verifyUrl } = body;

    if (!name || !email || !referralLink || !verifyUrl) {
        return NextResponse.json({ message: 'Faltan datos requeridos' }, { status: 400 });
    }

    try {
        const { error } = await resend.emails.send({
            from: 'Proyecto Colorado <noreply@proyectocolorado.com>',
            to: email,
            subject: '¡Bienvenido a Proyecto Colorado! Verifica tu cuenta',
            html: generateVerificationEmailHtml(name, referralLink, verifyUrl),
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ message: 'Error al enviar correo' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Correo de verificación enviado con éxito' }, { status: 200 });
    } catch (err) {
        console.error('Error inesperado:', err);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}

function generateVerificationEmailHtml(name: string, referralLink: string, verifyUrl: string): string {
    return `
    <div style="font-family: sans-serif; color: #333; max-width: 700px; margin: auto; border: 1px solid #eee;">
      <!-- Header -->
      <div style="background-color: #800000; color: white; padding: 20px; text-align: center;">
        <img src="https://www.proyectocolorado.com/_next/image?url=%2Fimages%2Flogo-secondary.png&w=3840&q=75" alt="Logo" style="max-width: 300px;" />
        <h2 style="margin-top: 10px;">¡Bienvenido a Proyecto Colorado!</h2>
      </div>

      <!-- Body -->
      <div style="padding: 20px;">
        <p>Hola <strong>${name}</strong>,</p>

        <p>Gracias por unirte a nuestra comunidad. Estamos muy felices de que formes parte de este proyecto.</p>

        <p>A continuación te compartimos tu enlace de referido para que puedas invitar a tus amigos y ganar beneficios:</p>

        <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <strong>${referralLink}</strong>
        </div>

        <p>Para finalizar tu registro, por favor verifica tu cuenta haciendo clic en el siguiente botón:</p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${verifyUrl}" style="display: inline-block; background-color: #800000; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Verificar mi cuenta
          </a>
        </div>

        <p style="margin-top: 40px; font-size: 14px; color: #555;">
          Si no fuiste tú quien solicitó esta cuenta, puedes ignorar este correo.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #800000; color: white; padding: 15px; text-align: center; font-size: 12px;">
        Proyecto Colorado © ${new Date().getFullYear()}<br/>
        www.proyectocolorado.com | contacto@proyectocolorado.com
      </div>
    </div>
  `;
}
