'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface AssignedNumber {
    number: string;
    is_blessed: boolean;
    is_minor_prize: boolean;
}

export default function SuccessClient() {
    const [winningNumbers, setWinningNumbers] = useState<AssignedNumber[]>([]);
    const [allNumbers, setAllNumbers] = useState<AssignedNumber[]>([]);
    const params = useSearchParams();
    const email = params.get('email');

    useEffect(() => {
        if (email) {
            fetch(`/api/assigned-numbers?email=${email}`)
                .then(res => res.json())
                .then(data => {
                    const all: AssignedNumber[] = data.numbers || [];
                    setAllNumbers(all);

                    const winners = all.filter(n => n.is_blessed);
                    setWinningNumbers(winners);
                });
        }
    }, [email]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4">
            <h1 className="text-2xl font-bold mb-4 text-green-600">¡Pago realizado con éxito! ✅</h1>
            {/* Mostrar ganadores si existen */}
            {winningNumbers.length > 0 ? (
                <>
                    <p className="mb-2 text-center">
                        🎉 ¡Felicidades! Has ganado con los siguientes números:
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
                        {winningNumbers.map((num, idx) => (
                            <div key={idx} className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded shadow text-center">
                                {num.number} {num.is_minor_prize ? '(Premio menor)' : '(Premio mayor)'}
                            </div>
                        ))}
                    </div>

                    {/* Solo mostrar este mensaje si hay ganadores */}
                    <p className="text-center text-sm text-gray-700 max-w-md mb-6">
                        Un representante se pondrá en contacto contigo dentro de las próximas <strong>48 horas</strong> para coordinar la entrega del premio.
                    </p>
                </>
            ) : (
                <p className="text-gray-500 mb-6 text-center">
                    No has ganado esta vez, pero gracias por participar. ¡Suerte para la próxima! 🍀
                </p>
            )}
            {/* Mostrar todos los números asignados */}
            <div className="mb-6 w-full max-w-lg">
                <h2 className="text-lg font-semibold mb-2 text-center">Tus números asignados:</h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {allNumbers.map((num, idx) => (
                        <div
                            key={idx}
                            className={`px-3 py-1 rounded text-center shadow text-sm ${num.is_blessed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            {num.number}
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-center text-sm text-gray-700 max-w-md mb-6">
                También recibirás un correo electrónico con los detalles de tu compra. Revisa tu bandeja de entrada y spam.
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
