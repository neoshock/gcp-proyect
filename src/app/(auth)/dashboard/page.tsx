'use client';

import { useEffect, useState } from 'react';
import { getDashboardMetrics } from '../services/metricsService';
import DashboardMetricCard from '../components/DashboardMetricCard';
import DashboardTables from '../components/DashboardTables';
import { DollarSign, Hash, Trophy, PieChart } from 'lucide-react';
import PaymentMethodGaugeMini from '../components/PaymentMethodGauge';

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<{
        totalSales: number
        totalNumbersSold: number
        totalWinners: number
        conversionRate: number
        transferSales: number
        stripeSales: number
        transferPercentage: number
        stripePercentage: number
    } | null>(null)

    useEffect(() => {
        getDashboardMetrics().then(setMetrics).catch(console.error)
    }, [])

    return (
        <div className="space-y-6">
            {/* Metrics Cards */}
            {metrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardMetricCard
                        icon={<DollarSign />}
                        title="Total Ventas"
                        value={`$${metrics.totalSales.toFixed(2)}`}
                    />
                    <DashboardMetricCard
                        icon={<Hash />}
                        title="Números Vendidos"
                        value={metrics.totalNumbersSold}
                    />
                    <DashboardMetricCard
                        icon={<Trophy />}
                        title="Ganadores"
                        value={metrics.totalWinners}
                    />
                    <DashboardMetricCard
                        icon={<PieChart />}
                        title="Método de Pago"
                        value={
                            <PaymentMethodGaugeMini
                                transferPercentage={metrics.transferPercentage}
                                stripePercentage={metrics.stripePercentage}
                            />
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tables */}
            <DashboardTables />
        </div>
    )
}
