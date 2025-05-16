import { Suspense } from 'react';
import TransferSuccessClient from './client';

export default function TransferSuccessPage() {
    return (
        <Suspense fallback={<div className="p-4">Cargando...</div>}>
            <TransferSuccessClient />
        </Suspense>
    );
}