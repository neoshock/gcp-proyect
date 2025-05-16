'use client';

export default function TransferSuccessClient() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4">
            <h1 className="text-2xl font-bold mb-4 text-blue-600">¡Gracias por tu compra! 🧾</h1>

            <p className="mb-4 text-center">
                Hemos recibido tu solicitud de participación mediante <strong>transferencia bancaria</strong>.
            </p>

            <p className="text-center text-sm text-gray-700 max-w-md mb-6">
                Debido a la alta demanda de compras, tu pedido será verificado y confirmado manualmente por nuestro equipo.
                Recibirás una respuesta dentro de un plazo máximo de <strong>24 horas</strong>.
            </p>

            <p className="text-center text-sm text-gray-700 max-w-md mb-6">
                Te enviaremos un correo electrónico una vez que tu participación haya sido validada. Revisa tu bandeja de entrada y también la carpeta de spam.
            </p>

            <a
                href="/"
                className="mt-2 text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
                Volver al inicio
            </a>
        </main>
    );
}
