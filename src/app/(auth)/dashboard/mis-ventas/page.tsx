'use client'

import { useEffect, useState } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
    getReferralStatsByUser,
    getReferralParticipantsByUser
} from '../../services/referidoService'
import { authService } from '../../services/authService'
import { toast } from 'sonner'
import { getReferralCode } from '../../services/referralAuthService'

const COLORS = ['#10B981', '#F59E0B']

export default function MisVentasPage() {
    const [stats, setStats] = useState<any>(null)
    const [participants, setParticipants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [referralCode, setReferralCode] = useState<string | null>(null)
    const [copySuccess, setCopySuccess] = useState<string>('')

    useEffect(() => {
        const load = async () => {
            try {
                const user = await authService.getUser()
                const uid = user.id

                // Obtener código de referido
                const code = await getReferralCode(uid)
                setReferralCode(code)

                const [s, p] = await Promise.all([
                    getReferralStatsByUser(uid),
                    getReferralParticipantsByUser(uid)
                ])
                setStats(s)
                setParticipants(p)
            } catch (e) {
                console.error(e)
                toast.error('Error cargando datos')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    const referralLink = referralCode ? `${window.location.origin}/?ref=${referralCode}` : ''

    const copyToClipboard = async () => {
        if (!referralLink) return
        try {
            await navigator.clipboard.writeText(referralLink)
            setCopySuccess('¡Enlace copiado!')
            setTimeout(() => setCopySuccess(''), 2000)
        } catch (e) {
            toast.error('Error copiando enlace')
        }
    }

    if (loading || !stats) return <div className="text-center py-12">Cargando...</div>

    const barData = [
        { name: 'Concretadas', value: stats.completedCount },
        { name: 'Pendientes', value: stats.pendingCount }
    ]

    const pieData = [
        { name: 'Comisión', value: stats.totalCommission },
        { name: 'Resto', value: stats.totalSales - stats.totalCommission }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mis Ventas</h2>

                <div className="flex items-center gap-2 max-w-lg w-full md:w-auto">
                    <label htmlFor="referralLink" className="font-semibold text-gray-700 whitespace-nowrap">
                        Tu enlace de referido:
                    </label>
                    <input
                        id="referralLink"
                        type="text"
                        readOnly
                        value={referralLink}
                        className="flex-grow border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 min-w-[150px]"
                    />
                    <button
                        onClick={copyToClipboard}
                        className="bg-[#800000] text-white px-3 py-1 rounded hover:bg-[#a00000] transition text-sm"
                    >
                        Copiar
                    </button>
                    {copySuccess && <span className="text-green-600 text-sm">{copySuccess}</span>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card title="Ventas Totales" value={`$${stats.totalSales.toFixed(2)}`} />
                <Card title="Comisión Total" value={`$${stats.totalCommission.toFixed(2)}`} />
                <Card title="Participantes" value={stats.totalParticipants} />
                <Card title="Boletos Vendidos" value={stats.totalTickets || 0} />
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Nombre', 'Email', 'Boletos', 'Monto', 'Estado'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{p.full_name}</td>
                                <td className="px-6 py-4">{p.email}</td>
                                <td className="px-6 py-4">{p.amount}</td>
                                <td className="px-6 py-4">${p.total_price.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${p.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {p.status === 'completed' ? 'Concretada' : 'Pendiente'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {participants.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-6 text-center text-gray-500">
                                    No tienes participantes aún.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartContainer title="Ventas por estado">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={barData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8">
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Distribución de comisión">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                            <RechartsTooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
        </div>
    )
}

function Card({ title, value }: { title: string; value: string | number }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-600">{title}</div>
        </div>
    )
}

function ChartContainer({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            {children}
        </div>
    )
}
