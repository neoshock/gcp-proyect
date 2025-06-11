// src/app/components/ReferidoModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import {
    createReferido,
    updateReferido,
    ReferidoInput,
    Referido,
} from '../services/referidoService'


interface ReferidoModalProps {
    isOpen: boolean
    onClose: () => void
    referido?: Referido | null
    onSuccess: () => void
}

export default function ReferidoModal({ isOpen, onClose, referido, onSuccess }: ReferidoModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        referral_code: '',
        commission_rate: 0.10,
        is_active: true
    })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (referido) {
            setFormData({
                name: referido.name || '',
                email: referido.email || '',
                phone: referido.phone || '',
                referral_code: referido.referral_code || '',
                commission_rate: referido.commission_rate || 0.10,
                is_active: referido.is_active ?? true
            })
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                referral_code: '',
                commission_rate: 0.10,
                is_active: true
            })
        }
        setErrors({})
    }, [referido, isOpen])

    const generateReferralCode = () => {
        const name = formData.name.trim()
        if (!name) {
            toast.error('Ingresa un nombre primero')
            return
        }

        const cleanName = name.replace(/\s+/g, '').toUpperCase().substring(0, 5)

        const randomPart = Array.from({ length: 10 }, () =>
            Math.random().toString(36)[2].toUpperCase()
        ).join('')

        const code = (cleanName + randomPart).substring(0, 20)
        setFormData(prev => ({ ...prev, referral_code: code }))
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es obligatorio'
        }

        if (formData.name.length < 3) {
            newErrors.name = 'El nombre debe tener al menos 3 caracteres'
        } else if (!/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(formData.name)) {
            newErrors.name = 'El nombre solo puede contener letras y espacios'
        }

        if (formData.phone && !/^\+?\d{7,15}$/.test(formData.phone)) {
            newErrors.phone = 'El teléfono no es válido'
        }

        if (!formData.referral_code.trim()) {
            newErrors.referral_code = 'El código de referido es obligatorio'
        } else if (formData.referral_code.length < 3) {
            newErrors.referral_code = 'El código debe tener al menos 3 caracteres'
        } else if (!/^[A-Z0-9]+$/.test(formData.referral_code)) {
            newErrors.referral_code = 'El código solo puede contener letras mayúsculas y números'
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'El email no es válido'
        }

        if (formData.commission_rate < 0 || formData.commission_rate > 1) {
            newErrors.commission_rate = 'La comisión debe estar entre 0% y 100%'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)

        try {
            const input: ReferidoInput = {
                ...formData,
                referral_code: formData.referral_code.toUpperCase(),
            }

            if (referido) {
                await updateReferido(referido.id, input)
                toast.success('Referido actualizado correctamente')
            } else {
                console.log('Creating new referido with input:', input)
                await createReferido(input)
                toast.success('Referido creado correctamente')
            }

            onSuccess()
        } catch (error: any) {
            if (error.message === 'duplicate_referral_code') {
                setErrors({ referral_code: 'Este código ya existe' })
            } else {
                console.error('Error saving referido:', error)
                toast.error(error.message || 'Error al guardar referido')
            }
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">

                <div className="fixed inset-0 transition-opacity z-50" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-60 relative">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {referido ? 'Editar Referido' : 'Nuevo Referido'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Nombre */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] sm:text-sm ${errors.name ? 'border-red-300' : ''
                                            }`}
                                        placeholder="Nombre del referido"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>
                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] sm:text-sm ${errors.email ? 'border-red-300' : ''
                                            }`}
                                        placeholder="email@ejemplo.com"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                        Teléfono *
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] sm:text-sm"
                                        placeholder="+593 99 999 9999"
                                    />
                                </div>

                                {/* Código de Referido */}
                                <div>
                                    <label htmlFor="referral_code" className="block text-sm font-medium text-gray-700">
                                        Código de Referido *
                                    </label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            id="referral_code"
                                            value={formData.referral_code}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                referral_code: e.target.value.toUpperCase()
                                            }))}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] sm:text-sm ${errors.referral_code ? 'border-red-300' : ''
                                                }`}
                                            placeholder="CODIGO2025"
                                        />
                                        <button
                                            type="button"
                                            onClick={generateReferralCode}
                                            className="inline-flex items-center px-4 py-2 border border-[#800000] text-[#800000] font-medium text-sm bg-white rounded-r-md hover:bg-[#f3eaea] focus:outline-none focus:ring-2 focus:ring-[#800000]"
                                        >
                                            Generar
                                        </button>
                                    </div>
                                    {errors.referral_code && (
                                        <p className="mt-1 text-sm text-red-600">{errors.referral_code}</p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        Enlace: {window.location.origin}/?ref={formData.referral_code || 'CODIGO'}
                                    </p>
                                </div>

                                {/* Comisión */}
                                <div>
                                    <label htmlFor="commission_rate" className="block text-sm font-medium text-gray-700">
                                        Comisión (%)
                                    </label>
                                    <input
                                        type="number"
                                        id="commission_rate"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={formData.commission_rate * 100}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            commission_rate: parseFloat(e.target.value) / 100
                                        }))}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] sm:text-sm ${errors.commission_rate ? 'border-red-300' : ''
                                            }`}
                                    />
                                    {errors.commission_rate && (
                                        <p className="mt-1 text-sm text-red-600">{errors.commission_rate}</p>
                                    )}
                                </div>

                                {/* Estado */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                        className="h-4 w-4 text-[#800000] focus:ring-[#800000] border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                        Referido activo
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#800000] text-base font-medium text-white hover:bg-[#600000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Guardando...' : (referido ? 'Actualizar' : 'Crear')}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}