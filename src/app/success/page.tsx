import { Suspense } from 'react';
import SuccessClient from './client';

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="p-4">Cargando...</div>}>
            <SuccessClient />
        </Suspense>
    );
}
