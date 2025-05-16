'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TransferSuccessClient() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const name = searchParams.get('name') ?? '';
        const lastName = searchParams.get('lastName') ?? '';
        const email = searchParams.get('email') ?? '';
        const phone = searchParams.get('phone') ?? '';
        const amount = searchParams.get('amount') ?? '1';
        const price = searchParams.get('price') ?? '0';
        const orderNumber = searchParams.get('orderNumber') ?? '';

        const productDetails = `Números Yamaha MT03 2025 | Actividad #1`;
        const totalAmount = parseFloat(price);

        const message = encodeURIComponent(
            `*¡Nuevo pedido de GPC!*\n\n` +
            `Número de pedido: *${orderNumber}*\n` +
            `Cliente: ${name} ${lastName}\n` +
            `Email: ${email}\n` +
            `Teléfono: ${phone}\n\n` +
            `*DETALLES DEL PEDIDO:*\n` +
            `Producto: ${productDetails}\n` +
            `Cantidad: ${amount}\n` +
            `Total: $${totalAmount.toFixed(2)}\n\n` +
            `Voy a realizar la transferencia y enviar el comprobante. Por favor, confirmar recepción.`
        );

        const phoneNumber = '593992319300';

        const timeout = setTimeout(() => {
            window.location.href = `https://wa.me/${phoneNumber}?text=${message}`;
        }, 2000);

        return () => clearTimeout(timeout);
    }, [searchParams]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
            <h1 className="text-2xl font-bold mb-4 text-blue-600">¡Gracias por tu compra! 🧾</h1>

            <p className="mb-4">
                Hemos recibido tu solicitud de participación mediante <strong>transferencia bancaria</strong>.
            </p>

            <p className="text-sm text-gray-700 max-w-md mb-4">
                Debido a la alta demanda de compras, tu pedido será verificado y confirmado manualmente por nuestro equipo.
                Recibirás una respuesta dentro de un plazo máximo de <strong>24 horas</strong>.
            </p>

            <p className="text-sm text-gray-700 max-w-md mb-4">
                Te enviaremos un correo electrónico una vez que tu participación haya sido validada. Revisa tu bandeja de entrada y también la carpeta de spam.
            </p>

            {/* Mensaje de redirección */}
            <div className="flex items-center gap-2 text-sm text-green-600 mb-6">
                <svg className="animate-spin h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Espere unos segundos, estamos redireccionando a WhatsApp...</span>
            </div>

            <a
                href="/"
                className="mt-2 text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
                Volver al inicio
            </a>
        </main>
    );
}
