import React from 'react';
import { TicketPurchase } from "../types/tickets";

export function TicketSearchModal({ isOpen, onClose, tickets }: {
    isOpen: boolean,
    onClose: () => void,
    tickets: TicketPurchase[]
}) {
    if (!isOpen) return null;

    const allNumbers = tickets.flatMap(purchase => purchase.numbers);

    const winnerNumbers = allNumbers.filter(n => n.isWinner);
    const regularNumbers = allNumbers.filter(n => !n.isWinner);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold">Tus números asignados</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-black text-2xl"
                        >
                            &times;
                        </button>
                    </div>

                    {allNumbers.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">No se encontraron boletos asociados a este correo electrónico.</p>
                    ) : (
                        <>
                            <p className="mb-4">Se encontraron {allNumbers.length} números asociados a tu correo electrónico:</p>

                            {winnerNumbers.length > 0 && (
                                <>
                                    <h4 className="text-xl font-semibold mb-2 text-yellow-700">🎉 Números ganadores</h4>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
                                        {winnerNumbers.map((num, idx) => (
                                            <div key={`winner-${idx}`} className="bg-yellow-200 text-yellow-800 px-4 py-2 rounded shadow text-center font-bold border border-yellow-500">
                                                {num.number}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <h4 className="text-lg font-semibold mb-2 text-gray-800">Números normales</h4>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
                                {regularNumbers.map((num, idx) => (
                                    <div key={`regular-${idx}`} className="bg-green-100 text-green-700 px-4 py-2 rounded shadow text-center">
                                        {num.number}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={onClose}
                            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
