'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createNewRaffleEntriesFromOrder } from '../services/rafflesService';

interface RaffleEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RaffleEntryModal({ isOpen, onClose, onSuccess }: RaffleEntryModalProps) {
    const [orderNumber, setOrderNumber] = useState('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e?: React.MouseEvent) => {
        // Prevenir comportamiento predeterminado si hay un evento
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!orderNumber.trim()) {
            toast.error('Debes ingresar un número de orden');
            return;
        }

        if (!quantity || quantity <= 0) {
            toast.error('La cantidad debe ser un número positivo');
            return;
        }

        setLoading(true);
        try {
            const result = await createNewRaffleEntriesFromOrder(orderNumber, Number(quantity));
            console.log('Resultado de la operación:', result);

            if (result.success) {
                if (result.assigned) {
                    toast.success(`Se asignaron ${result.total_assigned} números correctamente`);
                } else {
                    toast.info(result.message);
                }
                onSuccess();
                resetForm();
            } else {
                // Asegurar que mostramos el mensaje de error específico devuelto por el servicio
                toast.error(result.error || 'Error al registrar los números');
                console.error('Error detallado:', result.error);
            }
        } catch (error) {
            // Este bloque se ejecutará solo si hay un error no manejado en la llamada al servicio
            console.error('Error inesperado al procesar la solicitud:', error);
            toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setOrderNumber('');
        setQuantity('');
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevenir la recarga de la página
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Registrar Nuevos Números</h2>
                    <button
                        aria-label="Cerrar"
                        onClick={resetForm}
                        className="text-gray-500 hover:text-gray-700"
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4">
                    <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Orden
                    </label>
                    <input
                        id="orderNumber"
                        type="text"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ingrese el número de orden"
                        disabled={loading}
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad de Números
                    </label>
                    <input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : '')}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ingrese la cantidad"
                        disabled={loading}
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'Registrar'}
                    </button>
                </div>
            </div>
        </div>
    );
}