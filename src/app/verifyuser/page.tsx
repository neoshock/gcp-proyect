import { Suspense } from 'react'
import VerifyUserContent from './content'

export default function VerifyUserPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <VerifyUserContent />
        </Suspense>
    )
}
