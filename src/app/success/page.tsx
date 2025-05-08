'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
    const [assignedNumbers, setAssignedNumbers] = useState<number[]>([]);
    const params = useSearchParams();
    const email = params.get('email');

    useEffect(() => {
        if (email) {
            fetch(`/api/assigned-numbers?email=${email}`)
                .then(res => res.json())
                .then(data => {
                    setAssignedNumbers(data.numbers || []);
                });
        }
    }, [email]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4">
            <h1 className="text-2xl font-bold mb-4 text-green-600">¡Pago realizado con éxito! ✅</h1>
            <p className="mb-4">Gracias por participar. Estos son tus números asignados:</p>

            {assignedNumbers.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
                    {assignedNumbers.map((num, idx) => (
                        <div key={idx} className="bg-green-100 text-green-700 px-4 py-2 rounded shadow text-center">
                            {num}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">Cargando tus números asignados...</p>
            )}

            <a
                href="/"
                className="mt-4 text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
                Volver al inicio
            </a>
        </main>
    );
}
