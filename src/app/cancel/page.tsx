export default function CancelPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Pago cancelado ❌</h1>
            <p className="mb-4">Tu pago fue cancelado. Si fue un error, puedes intentarlo nuevamente.</p>
            <a
                href="/"
                className="mt-4 text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
                Volver al inicio
            </a>
        </main>
    );
}
