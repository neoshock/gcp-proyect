'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    validateReferralEmail,
    registerReferredUser,
    linkUserToReferral
} from '../(auth)/services/referralAuthService'

export default function VerifyUserPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const email = searchParams.get('email')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!email) {
            setError('Correo no proporcionado')
        }
    }, [email])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (!email) {
            setError('No se encontró el correo en la URL')
            return
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        setLoading(true)
        try {
            await validateReferralEmail(email)
            const user = await registerReferredUser(email, password)
            if (!user) throw new Error('No se pudo registrar el usuario')
            await linkUserToReferral(email, user.id)
            setSuccess(true)
            router.push('/login')
        } catch (err: any) {
            setError(err.message || 'Error al registrar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-100 p-4">
            <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full">
                <h1 className="text-3xl font-semibold text-center text-[#800000] mb-4">
                    ¡Bienvenido a nuestra comunidad!
                </h1>
                <p className="text-sm text-gray-600 text-center mb-6">
                    Gracias por unirte como referido. Para finalizar tu registro, por favor crea una contraseña. <br />
                    Verificar tu correo electrónico para activar tu cuenta.
                </p>
                {email && (
                    <p className="text-sm text-center text-gray-700 mb-4">
                        Registrando correo: <strong>{email}</strong>
                    </p>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-[#800000] text-white font-semibold rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Registrando...' : 'Crear cuenta'}
                    </button>
                </form>

                {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
                {success && (
                    <p className="text-green-600 mt-4 text-center">
                        Registro exitoso 🎉 ¡Redirigiendo al inicio de sesión!
                    </p>
                )}
            </div>
        </div>
    )
}
