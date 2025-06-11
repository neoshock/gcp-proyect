// src/app/(auth)/dashboard/referidos/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Eye, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import {
  getReferidos,
  deleteReferido,
  toggleReferidoStatus,
  Referido
} from '../../services/referidoService'
import ReferidoModal from '../../components/ReferidoModal'

export default function ReferidosPage() {
    const [referidos, setReferidos] = useState<Referido[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingReferido, setEditingReferido] = useState<Referido | null>(null)

    useEffect(() => {
        loadReferidos()
    }, [])

    const loadReferidos = async () => {
        try {
            setLoading(true)
            const data = await getReferidos()
            setReferidos(data)
        }
        catch (error) {
            toast.error('Error al cargar los referidos')
        }
        finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setEditingReferido(null)
        setModalOpen(true)
    }

    const handleEdit = (referido: Referido) => {
        setEditingReferido(referido)
        setModalOpen(true)
    }

    const handleDelete = async (referido: Referido) => {
        if (!confirm(`¿Estás seguro de eliminar el referido "${referido.name}"?`)) return

        try {
            await deleteReferido(referido.id)

            toast.success('Referido eliminado correctamente')
            loadReferidos()
        } catch (error) {
            console.log('Error deleting referido:', error)
            toast.error('Error al eliminar referido')
        }
    }

    const handleToggleActive = async (referido: Referido) => {
        try {
            if (!confirm(`¿Estás seguro de ${referido.is_active ? 'desactivar' : 'activar'} el referido "${referido.name}"?`)) return
            await toggleReferidoStatus(referido.id, referido.is_active)
            toast.success(`Referido "${referido.name}" ${referido.is_active ? 'desactivado' : 'activado'} correctamente`)
            loadReferidos()
        } catch (error) {
            console.log('Error toggling referido status:', error)
            toast.error('Error al cambiar estado del referido')
        }
    }

    const copyReferralLink = async (code: string) => {
        const link = `${window.location.origin}/?ref=${code}`
        try {
            await navigator.clipboard.writeText(link)
            toast.success('Enlace copiado al portapapeles')
        } catch (error) {
            toast.error('Error al copiar enlace')
        }
    }

    const openReferralLink = (code: string) => {
        const link = `${window.location.origin}/?ref=${code}`
        window.open(link, '_blank')
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="bg-white rounded-lg shadow animate-pulse">
                    <div className="h-96 bg-gray-100 rounded-lg"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Referidos</h2>
                    <p className="text-gray-600">Administra tus códigos de referidos y ve su rendimiento</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#600000] transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Referido
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-gray-900">{referidos.length}</div>
                    <div className="text-sm text-gray-600">Total Referidos</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-green-600">
                        ${referidos.reduce((sum, r) => sum + (r.total_sales || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Ventas Totales</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-blue-600">
                        {referidos.reduce((sum, r) => sum + (r.total_participants || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Participantes</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-purple-600">
                        ${referidos.reduce((sum, r) => sum + (r.total_commission || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Comisión Total</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Referido
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Participantes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ventas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Comisión
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {referidos.map((referido) => (
                                <tr key={referido.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {referido.name}
                                            </div>
                                            {referido.email && (
                                                <div className="text-sm text-gray-500">
                                                    {referido.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                {referido.referral_code}
                                            </span>
                                            <button
                                                onClick={() => copyReferralLink(referido.referral_code)}
                                                className="text-gray-400 hover:text-gray-600"
                                                title="Copiar enlace"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openReferralLink(referido.referral_code)}
                                                className="text-gray-400 hover:text-gray-600"
                                                title="Abrir enlace"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {referido.total_participants || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${(referido.total_sales || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${(referido.total_commission || 0).toFixed(2)}
                                        <div className="text-xs text-gray-500">
                                            ({(referido.commission_rate * 100).toFixed(1)}%)
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleActive(referido)}
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${referido.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {referido.is_active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(referido)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(referido)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {referidos.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-500">No hay referidos registrados</div>
                        <button
                            onClick={handleCreate}
                            className="mt-4 text-[#800000] hover:text-[#600000] font-medium"
                        >
                            Crear tu primer referido
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ReferidoModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                referido={editingReferido}
                onSuccess={() => {
                    setModalOpen(false)
                    loadReferidos()
                }}
            />
        </div>
    )
}